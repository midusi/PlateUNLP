import { useMeasure } from "@uidotdev/usehooks"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  TransformComponent,
  TransformWrapper,
  useControls,
  useTransformContext,
} from "react-zoom-pan-pinch"
import { Button } from "~/components/ui/button"
import { loadImage } from "~/lib/image"
import { clamp } from "~/lib/math"

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
   * Whether the bounding boxes can be modified by the user.
   * @default false
   */
  disabled?: boolean
  /**
   * Whether to show zoom actions (zoom in and zoom out buttons).
   * @default true
   */
  showZoomActions?: boolean
}

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
  disabled = false,
  showZoomActions = true,
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

  return (
    <div ref={containerRef} className="bg-checkered w-full h-full min-w-0 min-h-0 relative">
      {imageScale ? (
        <TransformWrapper
          initialScale={imageScale}
          minScale={imageScale}
          centerOnInit
          centerZoomedOut
        >
          <BoundingBoxControls showZoomActions={showZoomActions} />
          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentClass="relative"
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
          </TransformComponent>
        </TransformWrapper>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}

function BoundingBoxControls({ showZoomActions }: { showZoomActions: boolean }) {
  const { zoomIn, zoomOut } = useControls()

  return (
    <div className="absolute top-2 right-2 flex gap-2 z-10">
      {showZoomActions && (
        <Button size="icon" variant="outline" className="size-8" onClick={() => zoomIn()}>
          <span className="icon-[ph--magnifying-glass-plus-bold] size-4" />
        </Button>
      )}
      {showZoomActions && (
        <Button size="icon" variant="outline" className="size-8" onClick={() => zoomOut()}>
          <span className="icon-[ph--magnifying-glass-minus-bold]" />
        </Button>
      )}
    </div>
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
      className="absolute group grid"
      data-resizing={resizing !== null}
    >
      <p
        className="top-0 left-0 absolute origin-top-left group-hover:hidden group-[[data-resizing=true]]:hidden"
        style={{
          backgroundColor: boundingBox.color,
          transform: `scale(${1 / scale})`,
        }}
      >
        {boundingBox.name}
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
