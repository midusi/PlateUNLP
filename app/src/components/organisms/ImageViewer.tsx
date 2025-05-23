import type { Dispatch, SetStateAction } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"
import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { BoxMetadata } from "../molecules/BoxMetadataForm"
import { ImageWithBoundingBoxes } from "../molecules/ImageWithBoundingBoxes"

/**
 * Listado de props que espera recibir ImageViewer
 * @interface ImageViewer
 */
interface ImageViewerProps {
  src: string
  rotation: number
  bgWhite: boolean
  isDrawingMode: boolean
  setIsDrawingMode: Dispatch<SetStateAction<boolean>>
  selectedBoxId: string | null
  setSelectedBoxId: Dispatch<SetStateAction<string | null>>
  boundingBoxes: BoundingBox[]
  setBoundingBoxes: Dispatch<SetStateAction<BoundingBox[]>>
  boxMetadatas: BoxMetadata[]
  setBoxMetadatas: Dispatch<SetStateAction<BoxMetadata[]>>
}

// Ref https://github.com/BetterTyped/react-zoom-pan-pinch/blob/master/src/stories/examples/image-responsive/example.tsx
/**
 * Permite ver una imagen en una interfaz de arrastre con zoom.
 * @param {ImageViewerProps} param0 - Configuaracion y variables/funciones necesarias.
 * @returns - JSX que codifica el componente.
 */
export function ImageViewer({
  src,
  rotation,
  bgWhite,
  setIsDrawingMode,
  isDrawingMode,
  selectedBoxId,
  setSelectedBoxId,
  boundingBoxes,
  setBoundingBoxes,
  boxMetadatas,
  setBoxMetadatas,
}: ImageViewerProps) {
  const scaleUp = true
  //   const backgroundColor = "black"
  const zoomFactor = 30

  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [containerHeight, setContainerHeight] = useState<number>(0)

  const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(0)
  const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0)

  /** To know if show or not resizing controls */
  const [isResizing, setIsResizing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  const imageScale = useMemo(() => {
    if (
      containerWidth === 0 ||
      containerHeight === 0 ||
      imageNaturalWidth === 0 ||
      imageNaturalHeight === 0
    ) {
      return 0
    }
    const scale = Math.min(
      containerWidth / imageNaturalWidth,
      containerHeight / imageNaturalHeight,
    )
    return scaleUp ? scale : Math.max(scale, 1)
  }, [
    scaleUp,
    containerWidth,
    containerHeight,
    imageNaturalWidth,
    imageNaturalHeight,
  ])

  const handleResize = useCallback(() => {
    if (container !== null) {
      const rect = container.getBoundingClientRect()
      setContainerWidth(rect.width)
      setContainerHeight(rect.height)
    } else {
      setContainerWidth(0)
      setContainerHeight(0)
    }
  }, [container])

  useEffect(() => {
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [handleResize])

  const handleImageOnLoad = (image: HTMLImageElement) => {
    setImageNaturalWidth(image.naturalWidth)
    setImageNaturalHeight(image.naturalHeight)
  }

  useEffect(() => {
    const image = new Image()
    image.onload = () => handleImageOnLoad(image)
    image.src = src
  }, [src])

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: `
              linear-gradient(45deg, #ccc 25%, transparent 25%),
              linear-gradient(-45deg, #ccc 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #ccc 75%),
              linear-gradient(-45deg, transparent 75%, #ccc 75%)
          `,
        backgroundSize: "60px 60px",
        backgroundPosition: "0 0, 0 30px, 30px -30px, -30px 0px",
      }}
      ref={(el: HTMLDivElement | null) => setContainer(el)}
    >
      {imageScale > 0 && (
        <TransformWrapper
          key={`${containerWidth}x${containerHeight}`}
          initialScale={imageScale * 0.75}
          minScale={imageScale * 0.25}
          maxScale={imageScale * zoomFactor}
          centerOnInit
          centerZoomedOut
          doubleClick={{ step: 0.7 }}
          disabled={isDrawingMode || isResizing || isDragging}
        >
          <TransformComponent
            wrapperStyle={{
              height: "100%",
              width: "100%",
            }}
            contentStyle={{
              // background: "blue",
              objectFit: "contain",
              maxHeight: "100%",
              maxWidth: "100%",
            }}
          >
            <ImageWithBoundingBoxes
              src={src}
              rotation={rotation}
              bgWhite={bgWhite}
              isDrawingMode={isDrawingMode}
              setIsDrawingMode={setIsDrawingMode}
              isResizing={isResizing}
              setIsResizing={setIsResizing}
              setIsDragging={setIsDragging}
              dragOffsetRef={dragOffsetRef}
              selectedBoxId={selectedBoxId}
              setSelectedBoxId={setSelectedBoxId}
              boundingBoxes={boundingBoxes}
              setBoundingBoxes={setBoundingBoxes}
              boxMetadatas={boxMetadatas}
              setBoxMetadatas={setBoxMetadatas}
            />
          </TransformComponent>
        </TransformWrapper>
      )}
    </div>
  )
}
