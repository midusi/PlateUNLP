import { Toggle, ToggleGroup, Toolbar } from "@base-ui-components/react"
import { Link } from "@tanstack/react-router"
import { useMeasure } from "@uidotdev/usehooks"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  TransformComponent,
  TransformWrapper,
  useControls,
  useTransformContext,
} from "react-zoom-pan-pinch"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { loadImage } from "~/lib/image"
import { clamp } from "~/lib/math"
import { cn } from "~/lib/utils"

/**
 * `BoundingBox` type represents a rectangular area defined by its top-left corner, width, and height.
 */
export type BoundingBox = {
  /** Unique identifier for the bounding box. */
  id: string
  /** Name of the bounding box, used for display purposes. */
  name: string
  /** Position of the bounding box relative to the image. */
  top: number
  /** Position of the bounding box relative to the image. */
  left: number
  /** Width of the bounding box. */
  width: number
  /** Height of the bounding box. */
  height: number
  /** Color of the bounding box, as a valid CSS color string. */
  color: string
  /**
   * Indicates whether the bounding box can be modified by the user.
   * @default true
   */
  canChange?: boolean
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
  onBoundingBoxChange?: (boundingBox: BoundingBox) => void
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
   * Whether the bounding boxes can be modified by the user.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether to show zoom actions (zoom in and zoom out buttons).
   * @default true
   */
  showZoomActions?: boolean

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
  disabled = false,
  showZoomActions = true,
  showBBList = false,
  children,
}: BoundingBoxerProps) {
  // Size of the container and the image (natural size)
  const [containerRef, containerSize] = useMeasure()
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })

  // Update the image when the source is changed
  useEffect(() => {
    loadImage(imageSrc).then((image) => {
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight })
    })
  }, [imageSrc])

  // Calculate the scale of the image based on the container size
  const imageScale = useMemo(() => {
    if (
      !containerSize.width ||
      !containerSize.height ||
      imageSize.width === 0 ||
      imageSize.height === 0
    ) {
      return null
    }
    return Math.min(containerSize.width / imageSize.width, containerSize.height / imageSize.height)
  }, [containerSize.width, containerSize.height, imageSize.width, imageSize.height])

  // Control user actions
  const [selectedTool, setSelectedTool] = useState<BoundingBoxerTools>("select")

  return (
    <div ref={containerRef} className="relative h-full min-h-0 w-full min-w-0 bg-checkered">
      {imageScale ? (
        <TransformWrapper
          initialScale={imageScale}
          minScale={imageScale * 0.5}
          centerOnInit
          centerZoomedOut
        >
          <BoundingBoxControls
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            showDrawNew={onBoundingBoxAdd !== undefined}
            showZoomActions={showZoomActions}
          >
            {children}
          </BoundingBoxControls>
          {showBBList && <BoundingBoxList boundingBoxes={boundingBoxes} />}
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentClass={cn("relative", selectedTool === "draw" && "cursor-crosshair")}
          >
            <img
              src={imageSrc}
              width={imageSize.width}
              height={imageSize.height}
              style={{ maxWidth: imageSize.width, maxHeight: imageSize.height }}
            />
            {boundingBoxes.map((boundingBox) => (
              <BoundingBoxComponent
                key={boundingBox.id}
                boundingBox={boundingBox}
                onChange={onBoundingBoxChange}
                onChangeEnd={onBoundingBoxChangeEnd}
                limits={{ x: imageSize.width, y: imageSize.height }}
              />
            ))}
            <BoundingBoxDraw
              enabled={selectedTool === "draw"}
              onDrawEnd={onBoundingBoxAdd}
              limits={{ x: imageSize.width, y: imageSize.height }}
            />
          </TransformComponent>
        </TransformWrapper>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}

function BoundingBoxList({ boundingBoxes }: { boundingBoxes: BoundingBox[] }) {
  if (boundingBoxes.length === 0) return

  return (
    <Toolbar.Root
      id="bounding-boxes-list"
      className="absolute right-2 bottom-2 left-2 z-10 flex h-9 items-center gap-1 rounded-md border bg-background p-1 shadow-xs"
    >
      <ToggleGroup defaultValue={[boundingBoxes[0].id]} orientation="horizontal">
        {boundingBoxes.map((bb) => {
          return (
            <Toolbar.Button
              key={bb.id}
              render={
                <Toggle
                  render={
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-16 data-[pressed]:bg-accent! data-[pressed]:text-primary!"
                    />
                  }
                />
              }
              value="draw"
              title="Draw box"
            >
              <Link
                className="flex w-full flex-row items-center justify-center gap-1"
                to="/observation/$observationId"
                params={{ observationId: bb.id }}
              >
                <span
                  className="icon-[ph--rectangle-dashed-bold] size-4"
                  style={{ color: bb.color }}
                ></span>
                {bb.id.slice(0, 2)}...
              </Link>
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
  selectedTool,
  onToolChange,
  children,
}: {
  showDrawNew: boolean
  showZoomActions: boolean
  selectedTool: BoundingBoxerTools
  onToolChange: (tool: BoundingBoxerTools) => void
  children?: React.ReactNode
}) {
  const { zoomIn, zoomOut } = useControls()

  return (
    <Toolbar.Root className="absolute top-2 right-2 left-2 z-10 flex h-9 items-center gap-1 rounded-md border bg-background p-1 shadow-xs">
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
                  className="size-8 data-[pressed]:bg-accent! data-[pressed]:text-primary!"
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
                    className="size-8 data-[pressed]:bg-accent! data-[pressed]:text-primary!"
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
      <div className="flex-1" />
      {children}
    </Toolbar.Root>
  )
}

const BB_MIN_WIDTH = 5

function BoundingBoxComponent({
  boundingBox,
  onChange,
  onChangeEnd,
  limits,
}: {
  boundingBox: BoundingBox
  onChange?: (boundingBox: BoundingBox) => void
  onChangeEnd?: (boundingBox: BoundingBox) => void
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
  const ref = useRef<HTMLDivElement>(null)

  const [resizing, setResizing] = useState<{
    dir: `${"t" | "b" | ""}${"l" | "r" | ""}` | "c"
    initialMouse: { x: number; y: number }
    initialBoundingBox: Pick<BoundingBox, "left" | "top" | "width" | "height">
  } | null>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return
      if (!resizing) return

      e.preventDefault()
      e.stopPropagation()

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

      onChange?.({
        ...boundingBox,
        // Return integers
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
      })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (resizing !== null) {
        e.preventDefault()
        e.stopPropagation()
        setResizing(null)
        onChangeEnd?.(boundingBox)
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizing, scale, boundingBox, onChange, onChangeEnd, limits])

  const handleMouseDown = (dir: NonNullable<typeof resizing>["dir"]) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (boundingBox.canChange === false) return
    setResizing({
      dir,
      initialMouse: { x: e.clientX, y: e.clientY },
      initialBoundingBox: {
        left: boundingBox.left,
        top: boundingBox.top,
        width: boundingBox.width,
        height: boundingBox.height,
      },
    })
  }

  return (
    <div
      ref={ref}
      key={boundingBox.id}
      style={{
        top: boundingBox.top,
        left: boundingBox.left,
        width: boundingBox.width,
        height: boundingBox.height,
        gridTemplateColumns: `${handleWidth} 1fr ${handleWidth}`,
        gridTemplateRows: `${handleWidth} 1fr ${handleWidth}`,
      }}
      className="group absolute grid"
      data-resizing={resizing !== null}
    >
      {/* <p
        className="absolute top-0 left-0 origin-top-left group-hover:hidden group-[[data-resizing=true]]:hidden"
        style={{
          backgroundColor: boundingBox.color,
          transform: `scale(${1 / scale})`,
        }}
      >
        {boundingBox.name}
      </p> */}

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
        className="absolute box-border border-primary border-solid"
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
