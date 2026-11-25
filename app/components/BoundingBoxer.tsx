import { Toggle, ToggleGroup, Toolbar } from "@base-ui/react"
import { Link } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  type ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper,
  useControls,
  useTransformContext,
} from "react-zoom-pan-pinch"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { loadImage } from "~/lib/load-image"
import { clamp } from "~/lib/math"
import {
  boxFitsInside,
  boxFromExtent,
  endLinesOf,
  extendBoxToLines,
  orientedBoxExtent,
  type PlacedBox,
  rotatePlacedBox,
  toStoredGeometry,
} from "~/lib/oriented-box"
import { cn } from "~/lib/utils"

/**
 * `BoundingBox` type represents a rectangular area defined by its top-left corner, width, and height.
 *
 * It can also be an oriented box (OBB): `angle` tilts it around its center. In
 * that case `top/left/width/height` are the axis-aligned rectangle that
 * contains it (the one that gets cropped); the box itself is derived from that
 * rectangle and the angle. See `~/lib/oriented-box`.
 */
export type BoundingBox = {
  /** Unique identifier for the bounding box. */
  id: string
  /** Name of the bounding box, used for display purposes. */
  name: string
  /** Short user-facing label shown in the toolbar (e.g. an OBS-N letter). */
  label?: string
  /** Position of the bounding box relative to the image. */
  top: number
  /** Position of the bounding box relative to the image. */
  left: number
  /** Width of the bounding box. */
  width: number
  /** Height of the bounding box. */
  height: number
  /**
   * Tilt of the box in degrees, clockwise, in (-45, 45].
   * @default 0
   */
  angle?: number
  /** Color of the bounding box, as a valid CSS color string. */
  color: string
  /**
   * Indicates whether the bounding box can be modified by the user.
   * @default true
   */
  canChange?: boolean
}

/** What the user is doing to a bounding box when `onBoundingBoxChange` fires. */
export type BoundingBoxChangeInfo = {
  action: "move" | "resize" | "rotate"
  /** Edges being dragged (`t`, `b`, `l`, `r`) when `action` is `resize`. */
  dir?: string
  /** Size of the image, the box has to stay inside it. */
  limits: { x: number; y: number }
}

/**
 * `BoundingBoxer` component props.
 */
export type BoundingBoxerProps = {
  /** Source of image to be displayed. */
  imageSrc: string
  /** Array of bounding boxes to be displayed on the image. */
  boundingBoxes: BoundingBox[]
  /**
   * Function triggered when a bounding box is moved or modified.
   * The bounding box is identified by its `id`.
   */
  onBoundingBoxChange?: (boundingBox: BoundingBox, info?: BoundingBoxChangeInfo) => void
  /**
   * Function triggered when the user finishes modifying a bounding box.
   * The bounding box is identified by its `id`.
   */
  onBoundingBoxChangeEnd?: (boundingBox: BoundingBox) => void
  /**
   * Function triggered when a new bounding box is added. If not provided,
   * the user can't draw new bounding boxes.
   */
  onBoundingBoxAdd?: (boundingBox: Pick<BoundingBox, "top" | "left" | "width" | "height">) => void
  /**
   * Function triggered when a bounding box is deleted.
   * The bounding box is identified by its `id`.
   */
  onBoundingBoxDelete?: (id: string) => void
  /**
   * Whether the bounding boxes can be modified by the user.
   * @default false
   */
  disabled?: boolean
  /**
   * Boxes keep their end lines when they are rotated or their height changes: they get
   * longer or shorter along their own axis instead of wider. For boxes that share their
   * ends, like the spectra of an observation.
   * @default false
   */
  keepEndLines?: boolean
  /**
   * Whether to show zoom actions (zoom in and zoom out buttons).
   * @default true
   */
  showZoomActions?: boolean

  /**
   * Whether to show rotation actions (rotate left and rotate right buttons).
   * @default false
   */
  showRotateActions?: boolean

  /**
   * Function triggered when rotate-left action is clicked.
   */
  onRotateLeft?: () => void

  /**
   * Function triggered when rotate-right action is clicked.
   */
  onRotateRight?: () => void

  /**
   * Whether to show temporary image adjustment actions (brightness, invert, contrast).
   * @default false
   */
  showImageAdjustActions?: boolean

  /**
   * Mostrar listado de bounding boxes en la parte inferior
   * @default false
   */
  showBBList?: boolean

  /**
   * Aditional actions to be rendered inside the toolbar.
   */
  children?: React.ReactNode
}

/**
 * `BoundingBoxerTools` type represents the tools available in the `BoundingBoxer` component.
 * It can be either "select" for selecting and moving bounding boxes, or "draw" for drawing new bounding boxes.
 */
type BoundingBoxerTools = "select" | "draw"
type ColorFilterPreset = "none" | "warm" | "cool" | "green"

/**
 * `BoundingBoxer` component allows users to display an image with interactive bounding boxes.
 * Users can zoom in and out of the image, and modify the bounding boxes by dragging or resizing them.
 *
 * The `imageSrc` prop is the source of the image to be displayed, and `boundingBoxes` is an array of
 * bounding boxes to be displayed on the image.
 *
 * @param {BoundingBoxerProps} props - The properties for the BoundingBoxer component.
 */
export function BoundingBoxer({
  imageSrc,
  boundingBoxes,
  onBoundingBoxChange,
  onBoundingBoxChangeEnd,
  onBoundingBoxAdd,
  onBoundingBoxDelete,
  disabled = false,
  keepEndLines = false,
  showZoomActions = true,
  showRotateActions = false,
  showImageAdjustActions = false,
  showBBList = false,
  onRotateLeft,
  onRotateRight,
  children,
}: BoundingBoxerProps) {
  // Natural size of the image
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })
  const [imageError, setImageError] = useState<string | null>(null)
  // Scale that fits the image inside the zoom viewport, known once the viewport is laid out
  const [fitScale, setFitScale] = useState<number | null>(null)
  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  // Update the image when the source is changed
  useEffect(() => {
    let ignore = false

    setImageSize({ width: 0, height: 0 })
    setFitScale(null)
    setImageError(null)

    loadImage(imageSrc)
      .then((image) => {
        if (ignore) return
        setImageSize({ width: image.naturalWidth, height: image.naturalHeight })
      })
      .catch((error) => {
        if (ignore) return
        setImageError(error instanceof Error ? error.message : "Failed to load image")
      })

    return () => {
      ignore = true
    }
  }, [imageSrc])

  // Fit the image once TransformWrapper has applied the new minScale (child effects run first)
  useEffect(() => {
    if (fitScale !== null) transformRef.current?.centerView(fitScale, 0)
  }, [fitScale])

  // Control user actions
  const [selectedTool, setSelectedTool] = useState<BoundingBoxerTools>("select")
  // Box whose angle can be typed in the toolbar: the last one touched, or the only one.
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const selectedBox =
    boundingBoxes.find((box) => box.id === selectedBoxId) ??
    (boundingBoxes.length === 1 ? boundingBoxes[0] : undefined)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [isInverted, setIsInverted] = useState(false)
  const [colorFilterPreset, setColorFilterPreset] = useState<ColorFilterPreset>("none")

  const presetFilter = useMemo(() => {
    switch (colorFilterPreset) {
      case "warm":
        return "sepia(0.35) saturate(1.2) hue-rotate(-10deg)"
      case "cool":
        return "saturate(1.15) hue-rotate(20deg)"
      case "green":
        return "sepia(0.3) saturate(1.25) hue-rotate(55deg)"
      default:
        return ""
    }
  }, [colorFilterPreset])

  const imageFilter = useMemo(() => {
    const filters = [`brightness(${brightness}%)`, `contrast(${contrast}%)`]
    if (presetFilter) filters.push(presetFilter)
    if (isInverted) filters.push("invert(1)")
    return filters.join(" ")
  }, [brightness, contrast, isInverted, presetFilter])

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
      {imageError ? (
        <p className="p-3 text-destructive text-sm">{imageError}</p>
      ) : imageSize.width > 0 ? (
        <TransformWrapper
          key={imageSrc}
          ref={transformRef}
          minScale={fitScale ? fitScale * 0.5 : 0}
          centerOnInit
          centerZoomedOut
          wheel={{ activationKeys: ["Control"] }}
          onInit={(ref) => {
            // Measure the zoom viewport itself, not the container that also holds the toolbars
            const viewport = ref.instance.wrapperComponent
            if (!viewport) return
            setFitScale(
              Math.min(
                viewport.offsetWidth / imageSize.width,
                viewport.offsetHeight / imageSize.height,
              ),
            )
          }}
        >
          <BoundingBoxControls
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            showDrawNew={onBoundingBoxAdd !== undefined}
            showZoomActions={showZoomActions}
            showRotateActions={showRotateActions}
            showImageAdjustActions={showImageAdjustActions}
            onRotateLeft={onRotateLeft}
            onRotateRight={onRotateRight}
            brightness={brightness}
            contrast={contrast}
            isInverted={isInverted}
            selectedColorFilterPreset={colorFilterPreset}
            onBrightnessChange={setBrightness}
            onContrastChange={setContrast}
            onToggleInverted={() => setIsInverted((prev) => !prev)}
            onColorFilterPresetChange={setColorFilterPreset}
            angleInput={
              selectedBox && (
                <BoundingBoxAngleInput
                  key={selectedBox.id}
                  boundingBox={selectedBox}
                  limits={{ x: imageSize.width, y: imageSize.height }}
                  keepSpan={keepEndLines}
                  disabled={disabled || selectedBox.canChange === false}
                  onChange={onBoundingBoxChange}
                  onChangeEnd={onBoundingBoxChangeEnd}
                />
              )
            }
          >
            {children}
          </BoundingBoxControls>
          <TransformComponent
            wrapperClass="min-h-0 flex-1 bg-checkered"
            wrapperStyle={{ width: "100%" }}
            contentClass={cn(
              "relative",
              selectedTool === "draw" && "cursor-crosshair",
              fitScale === null && "invisible",
            )}
          >
            <img
              src={imageSrc}
              alt="Scanned plate"
              width={imageSize.width}
              height={imageSize.height}
              style={{
                maxWidth: imageSize.width,
                maxHeight: imageSize.height,
                filter: imageFilter,
              }}
            />
            {boundingBoxes.map((boundingBox) => (
              <BoundingBoxComponent
                key={boundingBox.id}
                boundingBox={boundingBox}
                onChange={onBoundingBoxChange}
                onChangeEnd={onBoundingBoxChangeEnd}
                onDelete={onBoundingBoxDelete}
                onSelect={setSelectedBoxId}
                keepSpan={keepEndLines}
                limits={{ x: imageSize.width, y: imageSize.height }}
                disabled={disabled}
              />
            ))}
            <BoundingBoxDraw
              enabled={selectedTool === "draw" && !disabled}
              onDrawEnd={onBoundingBoxAdd}
              limits={{ x: imageSize.width, y: imageSize.height }}
            />
          </TransformComponent>
          {showBBList && (
            <BoundingBoxList
              boundingBoxes={boundingBoxes}
              onChange={onBoundingBoxChange}
              onChangeEnd={onBoundingBoxChangeEnd}
            />
          )}
        </TransformWrapper>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}

function BoundingBoxList({
  boundingBoxes,
  onChange,
  onChangeEnd,
}: {
  boundingBoxes: BoundingBox[]
  onChange?: (boundingBox: BoundingBox) => void
  onChangeEnd?: (boundingBox: BoundingBox) => void
}) {
  if (boundingBoxes.length === 0) return

  const [labels, setLabels] = useState<Record<string, string>>({})
  const focusListenerRef = useRef<((e: PointerEvent) => void) | null>(null)

  useEffect(() => {
    const map: Record<string, string> = {}
    boundingBoxes.forEach((bb) => (map[bb.id] = bb.label ?? ""))
    setLabels(map)
  }, [boundingBoxes])

  return (
    <Toolbar.Root
      id="bounding-boxes-list"
      className="relative z-10 m-2 flex h-9 shrink-0 items-center gap-1 rounded-md border bg-background p-1 shadow-xs"
    >
      <ToggleGroup defaultValue={[boundingBoxes[0].id]} orientation="horizontal">
        {boundingBoxes.map((bb) => {
          // Save helper ensures same behavior for blur and Enter key
          const saveLabel = (value: string) => {
            const newLabel = value
            if (newLabel !== bb.label) {
              const updated = { ...bb, label: newLabel, name: newLabel }
              onChange?.(updated)
              onChangeEnd?.(updated)
            }
          }

          return (
            <Toolbar.Button
              key={bb.id}
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-auto min-w-fit gap-0 pr-1.5 data-pressed:bg-accent! data-pressed:text-primary!"
                />
              }
              title={bb.label}
            >
              <Link
                className="flex w-full flex-row items-center justify-center"
                to="/observation/$observationId"
                params={{ observationId: bb.id }}
              >
                <span className="icon-[ph--rectangle-dashed-bold] size-5" style={{ color: bb.color }} />
              </Link>
              <div className="ml-1 flex h-2 w-35 min-w-35 flex-row items-center justify-center rounded-full text-sm">
                <input
                  className="w-full"
                  value={labels[bb.id] ?? ""}
                  onChange={(e) => setLabels((p) => ({ ...p, [bb.id]: e.target.value }))}
                  onFocus={(e) => {
                    // When focused, add a document listener so clicks outside will blur the input.
                    // Use pointerdown + setTimeout to ensure blur happens after focus/mouse ordering.
                    const inputEl = e.currentTarget as HTMLInputElement
                    focusListenerRef.current = (ev: PointerEvent) => {
                      const target = ev.target
                      if (!(target instanceof Node) || !inputEl.contains(target as Node)) {
                        setTimeout(() => inputEl.blur(), 0)
                      }
                    }
                    document.addEventListener("pointerdown", focusListenerRef.current)
                  }}
                  onBlur={(e) => {
                    // Remove the outside-click listener
                    if (focusListenerRef.current) {
                      document.removeEventListener("pointerdown", focusListenerRef.current)
                      focusListenerRef.current = null
                    }
                    // Use saveLabel to guarantee same behavior
                    saveLabel(e.currentTarget.value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      // call saveLabel directly and then blur to keep same flow
                      saveLabel((e.currentTarget as HTMLInputElement).value)
                      ;(e.currentTarget as HTMLInputElement).blur()
                    }
                  }}
                />
              </div>
            </Toolbar.Button>
          )
        })}
      </ToggleGroup>
    </Toolbar.Root>
  )
}

function BoundingBoxControls({
  showDrawNew,
  showZoomActions,
  showRotateActions,
  showImageAdjustActions,
  selectedTool,
  onToolChange,
  onRotateLeft,
  onRotateRight,
  brightness,
  contrast,
  isInverted,
  selectedColorFilterPreset,
  onBrightnessChange,
  onContrastChange,
  onToggleInverted,
  onColorFilterPresetChange,
  angleInput,
  children,
}: {
  angleInput?: React.ReactNode
  showDrawNew: boolean
  showZoomActions: boolean
  showRotateActions: boolean
  showImageAdjustActions: boolean
  selectedTool: BoundingBoxerTools
  onToolChange: (tool: BoundingBoxerTools) => void
  onRotateLeft?: () => void
  onRotateRight?: () => void
  brightness: number
  contrast: number
  isInverted: boolean
  selectedColorFilterPreset: ColorFilterPreset
  onBrightnessChange: (value: number) => void
  onContrastChange: (value: number) => void
  onToggleInverted: () => void
  onColorFilterPresetChange: (preset: ColorFilterPreset) => void
  children?: React.ReactNode
}) {
  const { zoomIn, zoomOut } = useControls()
  const [hoveredAdjust, setHoveredAdjust] = useState<"brightness" | "contrast" | null>(null)
  const [pinnedAdjust, setPinnedAdjust] = useState<"brightness" | "contrast" | null>(null)
  const [hoveredFilterMenu, setHoveredFilterMenu] = useState(false)
  const [pinnedFilterMenu, setPinnedFilterMenu] = useState(false)
  const brightnessContainerRef = useRef<HTMLDivElement>(null)
  const contrastContainerRef = useRef<HTMLDivElement>(null)
  const filterMenuContainerRef = useRef<HTMLDivElement>(null)
  const hideBrightnessTimeoutRef = useRef<number | null>(null)
  const hideContrastTimeoutRef = useRef<number | null>(null)
  const hideFilterMenuTimeoutRef = useRef<number | null>(null)

  const clearHideTimeout = (kind: "brightness" | "contrast") => {
    if (kind === "brightness" && hideBrightnessTimeoutRef.current !== null) {
      window.clearTimeout(hideBrightnessTimeoutRef.current)
      hideBrightnessTimeoutRef.current = null
    }
    if (kind === "contrast" && hideContrastTimeoutRef.current !== null) {
      window.clearTimeout(hideContrastTimeoutRef.current)
      hideContrastTimeoutRef.current = null
    }
  }

  const scheduleHide = (kind: "brightness" | "contrast") => {
    clearHideTimeout(kind)
    const timeoutId = window.setTimeout(() => {
      setHoveredAdjust((current) => (current === kind ? null : current))
    }, 1000)
    if (kind === "brightness") hideBrightnessTimeoutRef.current = timeoutId
    if (kind === "contrast") hideContrastTimeoutRef.current = timeoutId
  }

  const clearFilterMenuHideTimeout = () => {
    if (hideFilterMenuTimeoutRef.current !== null) {
      window.clearTimeout(hideFilterMenuTimeoutRef.current)
      hideFilterMenuTimeoutRef.current = null
    }
  }

  const scheduleFilterMenuHide = () => {
    clearFilterMenuHideTimeout()
    hideFilterMenuTimeoutRef.current = window.setTimeout(() => {
      setHoveredFilterMenu(false)
    }, 300)
  }

  const showBrightnessSlider = hoveredAdjust === "brightness" || pinnedAdjust === "brightness"
  const showContrastSlider = hoveredAdjust === "contrast" || pinnedAdjust === "contrast"
  const showFilterMenu = hoveredFilterMenu || pinnedFilterMenu

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return

      if (!brightnessContainerRef.current?.contains(target)) {
        setHoveredAdjust((current) => (current === "brightness" ? null : current))
      }
      if (!contrastContainerRef.current?.contains(target)) {
        setHoveredAdjust((current) => (current === "contrast" ? null : current))
      }
      if (
        !brightnessContainerRef.current?.contains(target) &&
        !contrastContainerRef.current?.contains(target)
      ) {
        setPinnedAdjust(null)
      }

      if (!filterMenuContainerRef.current?.contains(target)) {
        setPinnedFilterMenu(false)
        setHoveredFilterMenu(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      clearHideTimeout("brightness")
      clearHideTimeout("contrast")
      clearFilterMenuHideTimeout()
    }
  }, [])

  return (
    <Toolbar.Root className="relative z-10 m-2 flex h-9 shrink-0 items-center gap-1 rounded-md border bg-background p-1 shadow-xs">
      <ToggleGroup
        value={[selectedTool]}
        onValueChange={(values) => {
          if (values.length > 0) onToolChange(values[0] as BoundingBoxerTools)
        }}
      >
        <Toolbar.Button
          render={
            <Toggle
              render={
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8 data-pressed:bg-accent! data-pressed:text-primary!"
                />
              }
            />
          }
          value="select"
          title="Select/Move"
        >
          <span className="icon-[ph--cursor-bold] size-4" />
        </Toolbar.Button>
        {showDrawNew && (
          <Toolbar.Button
            render={
              <Toggle
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 data-pressed:bg-accent! data-pressed:text-primary!"
                  />
                }
              />
            }
            value="draw"
            title="Draw box"
          >
            <span className="icon-[ph--bounding-box-bold] size-4" />
          </Toolbar.Button>
        )}
      </ToggleGroup>
      <Toolbar.Separator render={<Separator orientation="vertical" />} />
      {showZoomActions && (
        <Toolbar.Button
          render={<Button size="icon" variant="ghost" className="size-8" />}
          onClick={() => zoomIn()}
          title="Zoom in"
        >
          <span className="icon-[ph--magnifying-glass-plus-bold] size-4" />
        </Toolbar.Button>
      )}
      {showZoomActions && (
        <Toolbar.Button
          render={<Button size="icon" variant="ghost" className="size-8" />}
          onClick={() => zoomOut()}
          title="Zoom out"
        >
          <span className="icon-[ph--magnifying-glass-minus-bold] size-4" />
        </Toolbar.Button>
      )}
      <Toolbar.Separator render={<Separator orientation="vertical" />} />

      {showRotateActions && (
        <>
          <Toolbar.Button
            render={<Button size="icon" variant="ghost" className="size-8" />}
            onClick={() => onRotateLeft?.()}
            disabled={!onRotateLeft}
            title="Rotate left"
          >
            <span className="icon-[ph--arrow-counter-clockwise-bold] size-4" />
          </Toolbar.Button>
          <Toolbar.Button
            render={<Button size="icon" variant="ghost" className="size-8" />}
            onClick={() => onRotateRight?.()}
            disabled={!onRotateRight}
            title="Rotate right"
          >
            <span className="icon-[ph--arrow-clockwise-bold] size-4" />
          </Toolbar.Button>
        </>
      )}

      {showImageAdjustActions && (
        <>
          <div
            ref={brightnessContainerRef}
            className="relative ml-1"
            onMouseEnter={() => {
              clearHideTimeout("brightness")
              setHoveredAdjust("brightness")
            }}
            onMouseLeave={() => {
              scheduleHide("brightness")
            }}
          >
            <Toolbar.Button
              render={<Button size="icon" variant="ghost" className="size-8" />}
              onClick={() => {
                clearHideTimeout("brightness")
                if (pinnedAdjust === "brightness") {
                  setPinnedAdjust(null)
                  setHoveredAdjust(null)
                  return
                }
                setPinnedAdjust("brightness")
                setHoveredAdjust("brightness")
              }}
              title={`Brightness (${brightness}%)`}
            >
              <span className="icon-[ph--sun-bold] size-4" />
            </Toolbar.Button>
            <div
              className={cn(
                "absolute top-8 left-0 z-20 min-w-52 items-center gap-2 rounded-md border bg-background p-2 shadow-md",
                showBrightnessSlider ? "flex" : "hidden",
              )}
            >
              <input
                type="range"
                min={0}
                max={200}
                step={1}
                value={brightness}
                onChange={(e) => onBrightnessChange(Number(e.currentTarget.value))}
                className="h-2 w-32"
                title={`Brightness (${brightness}%)`}
                aria-label="Brightness"
              />
              <span className="w-10 text-right text-xs">{brightness}%</span>
            </div>
          </div>
          <Toolbar.Button
            render={
              <Button
                size="icon"
                variant="ghost"
                className={cn("size-8", isInverted && "bg-accent text-primary")}
              />
            }
            onClick={onToggleInverted}
            title="Invert colors"
          >
            <span className="icon-[ph--selection-inverse] size-4" />
          </Toolbar.Button>
          <div
            ref={contrastContainerRef}
            className="relative"
            onMouseEnter={() => {
              clearHideTimeout("contrast")
              setHoveredAdjust("contrast")
            }}
            onMouseLeave={() => {
              scheduleHide("contrast")
            }}
          >
            <Toolbar.Button
              render={<Button size="icon" variant="ghost" className="size-8" />}
              onClick={() => {
                clearHideTimeout("contrast")
                if (pinnedAdjust === "contrast") {
                  setPinnedAdjust(null)
                  setHoveredAdjust(null)
                  return
                }
                setPinnedAdjust("contrast")
                setHoveredAdjust("contrast")
              }}
              title={`Contrast (${contrast}%)`}
            >
              <span className="icon-[ph--circle-half-bold] size-4" />
            </Toolbar.Button>
            <div
              className={cn(
                "absolute top-8 left-0 z-20 min-w-52 items-center gap-2 rounded-md border bg-background p-2 shadow-md",
                showContrastSlider ? "flex" : "hidden",
              )}
            >
              <input
                type="range"
                min={0}
                max={200}
                step={1}
                value={contrast}
                onChange={(e) => onContrastChange(Number(e.currentTarget.value))}
                className="h-2 w-32"
                title={`Contrast (${contrast}%)`}
                aria-label="Contrast"
              />
              <span className="w-10 text-right text-xs">{contrast}%</span>
            </div>
          </div>

          <div
            ref={filterMenuContainerRef}
            className="relative ml-1"
            onMouseEnter={() => {
              clearFilterMenuHideTimeout()
              setHoveredFilterMenu(true)
            }}
            onMouseLeave={() => {
              scheduleFilterMenuHide()
            }}
          >
            <Toolbar.Button
              render={<Button size="icon" variant="ghost" className="size-8" />}
              onClick={() => {
                clearFilterMenuHideTimeout()
                setPinnedFilterMenu((prev) => !prev)
                setHoveredFilterMenu(true)
              }}
              title="Filters"
            >
              <span className="icon-[ph--faders-horizontal-bold] size-4" />
            </Toolbar.Button>

            <div
              className={cn(
                "absolute top-8 left-0 z-20 items-center gap-1 rounded-md border bg-background p-1 shadow-md",
                showFilterMenu ? "flex" : "hidden",
              )}
            >
              <Toolbar.Button
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "size-7",
                      selectedColorFilterPreset === "warm" && "bg-accent text-primary",
                    )}
                  />
                }
                onClick={() =>
                  onColorFilterPresetChange(selectedColorFilterPreset === "warm" ? "none" : "warm")
                }
                title="Warm"
              >
                <span className="icon-[ph--fire-bold] size-4" />
              </Toolbar.Button>

              <Toolbar.Button
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "size-7",
                      selectedColorFilterPreset === "cool" && "bg-accent text-primary",
                    )}
                  />
                }
                onClick={() =>
                  onColorFilterPresetChange(selectedColorFilterPreset === "cool" ? "none" : "cool")
                }
                title="Cool"
              >
                <span className="icon-[ph--snowflake-bold] size-4" />
              </Toolbar.Button>

              <Toolbar.Button
                render={
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "size-7",
                      selectedColorFilterPreset === "green" && "bg-accent text-primary",
                    )}
                  />
                }
                onClick={() =>
                  onColorFilterPresetChange(selectedColorFilterPreset === "green" ? "none" : "green")
                }
                title="Green"
              >
                <span className="icon-[ph--leaf-bold] size-4" />
              </Toolbar.Button>
            </div>
          </div>
        </>
      )}

      <div className="flex-1" />
      {angleInput}
      {children}
    </Toolbar.Root>
  )
}

const BB_MIN_WIDTH = 5
/** Largest tilt the rotation handle gives (the models predict within (-45, 45]). */
const BB_MAX_ANGLE = 45
/** Within this many degrees of the horizontal the rotation handle levels the box (angle 0). */
const BB_LEVEL_SNAP = 0.3

/** The oriented box a `BoundingBox` describes. Its center is the one of its rectangle. */
function placedBoxOf(
  box: Pick<BoundingBox, "left" | "top" | "width" | "height" | "angle">,
): PlacedBox {
  return {
    ...boxFromExtent(box.width, box.height, box.angle ?? 0),
    centerX: box.left + box.width / 2,
    centerY: box.top + box.height / 2,
  }
}

/** `box` with the geometry of `placed`: integer rectangle that contains it, inside `limits`. */
function withPlacedBox(
  box: BoundingBox,
  placed: PlacedBox,
  limits: { x: number; y: number },
  /** false: the box is not shrunk nor moved to fit inside `limits` (used when rotating). */
  fit = true,
) {
  const stored = toStoredGeometry(placed, limits, fit)
  return {
    ...box,
    left: stored.imageLeft,
    top: stored.imageTop,
    width: stored.imageWidth,
    height: stored.imageHeight,
    angle: stored.imageAngle,
  }
}

/** Toolbar field to type the tilt, in degrees, of the selected box. */
function BoundingBoxAngleInput({
  boundingBox,
  limits,
  keepSpan,
  disabled,
  onChange,
  onChangeEnd,
}: {
  keepSpan: boolean
  boundingBox: BoundingBox
  limits: { x: number; y: number }
  disabled: boolean
  onChange?: (boundingBox: BoundingBox, info?: BoundingBoxChangeInfo) => void
  onChangeEnd?: (boundingBox: BoundingBox) => void
}) {
  const angle = boundingBox.angle ?? 0
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (text: string) => {
    setDraft(null)
    const typed = Number.parseFloat(text.replace(",", "."))
    if (!Number.isFinite(typed)) return
    const placed = placedBoxOf(boundingBox)
    const target = clamp(Math.round(typed * 10) / 10, -BB_MAX_ANGLE, BB_MAX_ANGLE)
    // The box stops at the largest tilt that still fits inside the image.
    const turned = rotatePlacedBox(placed, target, limits, keepSpan)
    if (turned.angle === angle) return
    const rotated = withPlacedBox(boundingBox, turned, limits, false)
    onChange?.(rotated, { action: "rotate", limits })
    onChangeEnd?.(rotated)
  }

  return (
    <label className="mr-2 flex items-center gap-1 text-xs" title="Tilt of the selected box, in degrees">
      <span className="text-muted-foreground">
        {boundingBox.label || boundingBox.name || "Box"} angle
      </span>
      <input
        type="number"
        step={0.1}
        min={-BB_MAX_ANGLE}
        max={BB_MAX_ANGLE}
        disabled={disabled}
        value={draft ?? angle.toFixed(1)}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onBlur={(e) => draft !== null && commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value)
          if (e.key === "Escape") setDraft(null)
        }}
        className="h-7 w-16 rounded-md border bg-background px-1 text-right"
        aria-label="Box angle in degrees"
      />
      <span>°</span>
    </label>
  )
}

function BoundingBoxComponent({
  boundingBox,
  onChange,
  onChangeEnd,
  onDelete,
  onSelect,
  keepSpan = false,
  limits,
  disabled = false,
}: {
  keepSpan?: boolean
  boundingBox: BoundingBox
  onChange?: (boundingBox: BoundingBox, info?: BoundingBoxChangeInfo) => void
  onChangeEnd?: (boundingBox: BoundingBox) => void
  onDelete?: (id: string) => void
  onSelect?: (id: string) => void
  limits: { x: number; y: number }
  disabled?: boolean
}) {
  // We don't use `KeepScale` because we want to adjust the border width but
  // keep the scale. Since we are doing that, is too much overhead to use it
  // for the label as well.
  const [scale, setScale] = useState(1)
  const context = useTransformContext()
  useEffect(() => {
    // Set scale on component mount - important when appending
    // a new bounding box after initialization of the TransformWrapper
    setScale(context.getContext().instance.transformState.scale)

    // Listen for changes in scale
    const unmountInit = context.onInit((ref) => {
      setScale(ref.instance.transformState.scale)
    })
    const unmountChange = context.onChange((ref) => {
      const state = ref.instance.transformState
      if (state.previousScale !== state.scale) {
        setScale(state.scale)
      }
    })
    return () => {
      unmountInit()
      unmountChange()
    }
  }, [context])

  const handleWidth = `${3 / scale}px`

  // Handle resize
  const ref = useRef<HTMLDivElement>(null)

  const [resizing, setResizing] = useState<{
    dir: `${"t" | "b" | ""}${"l" | "r" | ""}` | "c" | "rotate"
    initialMouse: { x: number; y: number }
    initialBoundingBox: Pick<BoundingBox, "left" | "top" | "width" | "height" | "angle">
  } | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      if (!resizing) return

      e.preventDefault()
      e.stopPropagation()

      const initialPlaced = placedBoxOf(resizing.initialBoundingBox)

      // Rotate: the angle is the one between "up" and the line from the center to the mouse.
      if (resizing.dir === "rotate") {
        const rect = ref.current.getBoundingClientRect()
        const dx = e.clientX - (rect.left + rect.width / 2)
        const dy = e.clientY - (rect.top + rect.height / 2)
        const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI
        const snapped = Math.abs(degrees) < BB_LEVEL_SNAP ? 0 : Math.round(degrees * 10) / 10
        const target = clamp(snapped, -BB_MAX_ANGLE, BB_MAX_ANGLE)
        // Gira sobre su centro; si se acerca al borde de la imagen simplemente no gira mas.
        const turned = rotatePlacedBox(initialPlaced, target, limits, keepSpan)
        onChange?.(withPlacedBox(boundingBox, turned, limits, false), {
          action: "rotate",
          limits,
        })
        return
      }

      // Tilted box: move and resize in the box's own axes.
      if ((resizing.initialBoundingBox.angle ?? 0) !== 0) {
        const dx = (e.clientX - resizing.initialMouse.x) / scale
        const dy = (e.clientY - resizing.initialMouse.y) / scale
        const radians = (initialPlaced.angle * Math.PI) / 180
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        let placed: PlacedBox = initialPlaced
        if (resizing.dir === "c") {
          // Move: the box slides along the image borders instead of leaving the image.
          const extent = orientedBoxExtent(initialPlaced)
          placed = {
            ...initialPlaced,
            centerX: clamp(initialPlaced.centerX + dx, extent.width / 2, limits.x - extent.width / 2),
            centerY: clamp(initialPlaced.centerY + dy, extent.height / 2, limits.y - extent.height / 2),
          }
        } else {
          // Mouse movement along the box's width axis (du) and height axis (dv).
          const du = dx * cos + dy * sin
          const dv = -dx * sin + dy * cos
          /** The box after dragging the edge(s) a fraction `t` of the way to the mouse. */
          const resized = (t: number): PlacedBox => {
            let x0 = -initialPlaced.width / 2
            let x1 = initialPlaced.width / 2
            let y0 = -initialPlaced.height / 2
            let y1 = initialPlaced.height / 2
            if (resizing.dir.includes("t")) y0 = Math.min(y0 + dv * t, y1 - BB_MIN_WIDTH)
            else if (resizing.dir.includes("b")) y1 = Math.max(y1 + dv * t, y0 + BB_MIN_WIDTH)
            if (resizing.dir.includes("l")) x0 = Math.min(x0 + du * t, x1 - BB_MIN_WIDTH)
            else if (resizing.dir.includes("r")) x1 = Math.max(x1 + du * t, x0 + BB_MIN_WIDTH)
            const midX = (x0 + x1) / 2
            const midY = (y0 + y1) / 2
            const result: PlacedBox = {
              ...initialPlaced,
              width: x1 - x0,
              height: y1 - y0,
              centerX: initialPlaced.centerX + midX * cos - midY * sin,
              centerY: initialPlaced.centerY + midX * sin + midY * cos,
            }
            // Changing only the height keeps the end lines: the box slides along its axis.
            if (keepSpan && !/[lr]/.test(resizing.dir)) {
              return extendBoxToLines(result, endLinesOf(initialPlaced))
            }
            return result
          }
          // The opposite edge stays where it is: if the dragged edge would leave the
          // image it stops at the border (largest fraction of the drag that still fits).
          placed = resized(1)
          if (!boxFitsInside(placed, limits)) {
            let low = 0
            let high = 1
            for (let i = 0; i < 30; i++) {
              const mid = (low + high) / 2
              if (boxFitsInside(resized(mid), limits)) low = mid
              else high = mid
            }
            placed = resized(low)
          }
        }
        onChange?.(withPlacedBox(boundingBox, placed, limits, false), {
          action: resizing.dir === "c" ? "move" : "resize",
          dir: resizing.dir,
          limits,
        })
        return
      }

      let deltaLeft = (e.clientX - resizing.initialMouse.x) / scale
      let deltaTop = (e.clientY - resizing.initialMouse.y) / scale
      let left = resizing.initialBoundingBox.left
      let top = resizing.initialBoundingBox.top
      let width = resizing.initialBoundingBox.width
      let height = resizing.initialBoundingBox.height

      // Update the bounding box dimensions based on the resizing direction
      if (resizing.dir.includes("t")) {
        deltaTop = clamp(deltaTop, -top, height - BB_MIN_WIDTH)
        top += deltaTop
        height -= deltaTop
      } else if (resizing.dir.includes("b")) {
        height = clamp(height + deltaTop, BB_MIN_WIDTH, limits.y - top)
      }
      if (resizing.dir.includes("l")) {
        deltaLeft = clamp(deltaLeft, -left, width - BB_MIN_WIDTH)
        left += deltaLeft
        width -= deltaLeft
      } else if (resizing.dir.includes("r")) {
        width = clamp(width + deltaLeft, BB_MIN_WIDTH, limits.x - left)
      }
      if (resizing.dir === "c") {
        left = clamp(left + deltaLeft, 0, limits.x - width)
        top = clamp(top + deltaTop, 0, limits.y - height)
      }

      onChange?.(
        {
          ...boundingBox,
          // Return integers
          left: Math.round(left),
          top: Math.round(top),
          width: Math.round(width),
          height: Math.round(height),
        },
        { action: resizing.dir === "c" ? "move" : "resize", dir: resizing.dir, limits },
      )
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (resizing !== null) {
        e.preventDefault()
        e.stopPropagation()
        setResizing(null)
        console.log("#A BoundingBoxComponent resize end - calling onChangeEnd", { id: boundingBox.id })
        onChangeEnd?.(boundingBox)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizing, scale, boundingBox, onChange, onChangeEnd, limits, keepSpan])

  const handleMouseDown = (dir: NonNullable<typeof resizing>["dir"]) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect?.(boundingBox.id)
    if (boundingBox.canChange === false) return
    if (disabled) return
    setResizing({
      dir,
      initialMouse: { x: e.clientX, y: e.clientY },
      initialBoundingBox: {
        left: boundingBox.left,
        top: boundingBox.top,
        width: boundingBox.width,
        height: boundingBox.height,
        angle: boundingBox.angle,
      },
    })
  }

  // The element is the box itself (before rotating), centered on its rectangle and
  // tilted around that center. Without a tilt it is the rectangle.
  const placed = placedBoxOf(boundingBox)
  const angle = boundingBox.angle ?? 0
  const canRotate = !disabled && boundingBox.canChange !== false

  return (
    <div
      ref={ref}
      key={boundingBox.id}
      style={{
        top: placed.centerY - placed.height / 2,
        left: placed.centerX - placed.width / 2,
        width: placed.width,
        height: placed.height,
        transform: angle !== 0 ? `rotate(${angle}deg)` : undefined,
        transformOrigin: "center",
        gridTemplateColumns: `${handleWidth} 1fr ${handleWidth}`,
        gridTemplateRows: `${handleWidth} 1fr ${handleWidth}`,
      }}
      className="group absolute grid"
      data-resizing={resizing !== null}
    >
      <button
        type="button"
        aria-label="Delete bounding box"
        onClick={(e) => {
          e.stopPropagation()
          onDelete?.(boundingBox.id)
        }}
        style={{
          width: `${16 / scale}px`,   // Equivale a w-4 (16px)
          height: `${16 / scale}px`,  // Equivale a h-4 (16px)
          top: `${-6 / scale}px`,     // Equivale a -top-1.5 (-6px)
          right: `${-6 / scale}px`,   // Equivale a -right-1.5 (-6px)
        }}
        // Se eliminaron h-4, w-4, -top-1.5, -right-1.5 de este className
        className="absolute z-10 hidden cursor-pointer items-center justify-center rounded-full border border-black bg-white text-black shadow-sm transition-colors hover:bg-black hover:text-white group-hover:flex group-data-[resizing=true]:hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 14 14"
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          // Hacemos que el ícono interno también se ajuste al tamaño del contenedor
          style={{ width: '60%', height: '60%' }} 
        >
          <path d="M3 3l8 8m0-8l-8 8" />
        </svg>
      </button>
      {canRotate && (
        // Centered on the top edge, so the mouse never leaves the box on its way to it.
        <button
          type="button"
          title="Drag to rotate. Drop it near the horizontal to level the box"
          aria-label="Rotate bounding box"
          onMouseDown={handleMouseDown("rotate")}
          style={{
            width: `${34 / scale}px`,
            height: `${34 / scale}px`,
            top: `${-17 / scale}px`,
            left: `calc(50% - ${17 / scale}px)`,
            borderWidth: `${1 / scale}px`,
            fontSize: `${10 / scale}px`,
          }}
          className="absolute z-10 hidden cursor-grab items-center justify-center rounded-full border-black border-solid bg-white p-0 text-black leading-none shadow-sm group-hover:flex group-data-[resizing=true]:flex"
        >
          {/* Keeps the text upright while the box is tilted. */}
          <span style={{ transform: `rotate(${-angle}deg)` }}>{angle.toFixed(1)}°</span>
        </button>
      )}
      <p
        className="absolute top-0 left-0 origin-top-left group-hover:hidden group-[[data-resizing=true]]:hidden"
        style={{
          backgroundColor: boundingBox.color,
          transform: `scale(${1 / scale})`,
          color: '#1e1e1e',
          padding: "0 4px",
        }}
      >
        {boundingBox.label}
      </p>

      {/* Top-left */}
      <div
        style={{ backgroundColor: boundingBox.color }}
        className="cursor-nwse-resize"
        onMouseDown={handleMouseDown("tl")}
      />
      {/* Top */}
      <div
        style={{ backgroundColor: boundingBox.color }}
        className="cursor-ns-resize"
        onMouseDown={handleMouseDown("t")}
      />
      {/* Top-right */}
      <div
        style={{ backgroundColor: boundingBox.color }}
        className="cursor-nesw-resize"
        onMouseDown={handleMouseDown("tr")}
      />
      {/* Left */}
      <div
        style={{ backgroundColor: boundingBox.color }}
        className="cursor-ew-resize"
        onMouseDown={handleMouseDown("l")}
      />
      {/* Center */}
      <div className="cursor-move" onMouseDown={handleMouseDown("c")} />
      {/* Right */}
      <div
        style={{ backgroundColor: boundingBox.color }}
        className="cursor-ew-resize"
        onMouseDown={handleMouseDown("r")}
      />
      {/* Bottom-left */}
      <div
        style={{ backgroundColor: boundingBox.color }}
        className="cursor-nesw-resize"
        onMouseDown={handleMouseDown("bl")}
      />
      {/* Bottom */}
      <div
        style={{ backgroundColor: boundingBox.color }}
        className="cursor-ns-resize"
        onMouseDown={handleMouseDown("b")}
      />
      {/* Bottom-right */}
      <div
        style={{ backgroundColor: boundingBox.color }}
        className="cursor-nwse-resize"
        onMouseDown={handleMouseDown("br")}
      />
    </div>
  )
}

function BoundingBoxDraw({
  enabled,
  onDrawEnd,
  limits,
}: {
  enabled: boolean
  onDrawEnd?: (boundingBox: Pick<BoundingBox, "top" | "left" | "width" | "height">) => void
  limits: { x: number; y: number }
}) {
  // We don't use `KeepScale` because we want to adjust the border width but
  // keep the scale. Since we are doing that, is too much overhead to use it
  // for the label as well.
  const [scale, setScale] = useState(1)
  const context = useTransformContext()
  useEffect(() => {
    // Set scale on component mount - important when appending
    // a new bounding box after initialization of the TransformWrapper
    setScale(context.getContext().instance.transformState.scale)

    // Listen for changes in scale
    const unmountInit = context.onInit((ref) => {
      setScale(ref.instance.transformState.scale)
    })
    const unmountChange = context.onChange((ref) => {
      const state = ref.instance.transformState
      if (state.previousScale !== state.scale) {
        setScale(state.scale)
      }
    })
    return () => {
      unmountInit()
      unmountChange()
    }
  }, [context])

  const handleWidth = `${3 / scale}px`

  // Handle resize
  const [drawing, setDrawing] = useState(false)
  const [initialMouse, setInitialMouse] = useState({ x: 0, y: 0, top: 0, left: 0 })
  const [boundingBox, setBoundingBox] = useState({ top: 0, left: 0, width: 0, height: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!drawing) return

      e.preventDefault()
      e.stopPropagation()

      const deltaX = (e.clientX - initialMouse.x) / scale
      const deltaY = (e.clientY - initialMouse.y) / scale
      let left = 0
      let top = 0
      let width = 0
      let height = 0

      // Update the bounding box dimensions based on the resizing direction
      if (deltaY < 0) {
        top = clamp(initialMouse.top + deltaY, 0, initialMouse.top - BB_MIN_WIDTH)
        height = clamp(-deltaY, BB_MIN_WIDTH, initialMouse.top - top)
      } else {
        top = initialMouse.top
        height = clamp(deltaY, BB_MIN_WIDTH, limits.y - initialMouse.top)
      }
      if (deltaX < 0) {
        left = clamp(initialMouse.left + deltaX, 0, initialMouse.left - BB_MIN_WIDTH)
        width = clamp(-deltaX, BB_MIN_WIDTH, initialMouse.left - left)
      } else {
        left = initialMouse.left
        width = clamp(deltaX, BB_MIN_WIDTH, limits.x - initialMouse.left)
      }

      setBoundingBox({
        // Return integers
        top: Math.round(top),
        left: Math.round(left),
        width: Math.round(width),
        height: Math.round(height),
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!drawing) return
      e.preventDefault()
      e.stopPropagation()
      setDrawing(false)
      onDrawEnd?.(boundingBox)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [drawing, scale, boundingBox, initialMouse, onDrawEnd, limits])

  if (drawing) {
    return (
      <div
        style={{
          top: boundingBox.top,
          left: boundingBox.left,
          width: boundingBox.width,
          height: boundingBox.height,
          borderWidth: handleWidth,
        }}
        className="absolute box-border border-dashed border-sky-400 bg-sky-400/10"
      />
    )
  } else if (enabled) {
    return (
      <div
        className="absolute inset-0"
        onMouseDown={(e) => {
          if (drawing) return
          e.preventDefault()
          e.stopPropagation()
          // Get relation clientX,Y to pixel position
          const rect = e.currentTarget.getBoundingClientRect()
          const top = (e.clientY - rect.top) * (limits.y / rect.height)
          const left = (e.clientX - rect.left) * (limits.x / rect.width)
          setInitialMouse({ x: e.clientX, y: e.clientY, top, left })
          setBoundingBox({ top, left, width: BB_MIN_WIDTH, height: BB_MIN_WIDTH })
          setDrawing(true)
        }}
      />
    )
  }
  return null
}
