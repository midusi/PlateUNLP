import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { Dispatch, SetStateAction } from "react"
import { classesSpectrumDetection } from "@/enums/BBClasses"
import clsx from "clsx"
import { Palette, RotateCw, Square, Trash2 } from "lucide-react"
import { nanoid } from "nanoid"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { TransformComponent, TransformWrapper, useTransformComponent } from "react-zoom-pan-pinch"
import { Button } from "../atoms/button"
import { Card } from "../atoms/card"

// interface BBUIProps {

// }

export function BBUI() {
  const [image, setImage] = useState<null | string> (null)
  const [bgWhite, setBgWhite] = useState(true)
  const [rotation, setRotation] = useState(0)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([])

  const handleDeleteSelected = useCallback(() => {
    if (selectedBoxId) {
      setBoundingBoxes(prev => prev.filter(box => box.id !== selectedBoxId))
      setSelectedBoxId(null)
    }
  }, [selectedBoxId])

  return (
    <>
      <Card className="overflow-hidden">
        <div className="bg-slate-100 p-2 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Tools</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => { setRotation((rotation + 90) % 360) }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-black bg-white hover:bg-slate-50"
              >
                <RotateCw className="h-4 w-4" />
                <span>
                  {`Rotate 90º from ${rotation}º`}
                </span>
              </Button>
              <Button
                onClick={() => { setBgWhite(!bgWhite) }}
                variant="outline"
                size="sm"
                className={clsx(
                  "flex items-center gap-2",
                  bgWhite
                    ? "bg-white text-black hover:bg-slate-50"
                    : "bg-slate-800 text-white hover:bg-slate-700",
                )}
              >
                <Palette className="h-4 w-4" />
                <span>Invert colors</span>
              </Button>
              <Button
                onClick={() => {
                  setIsDrawingMode(!isDrawingMode)
                  // setSelectedBoxId(null)
                }}
                variant="outline"
                size="sm"
                className={clsx(
                  "flex items-center gap-2",
                  isDrawingMode
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-white text-black hover:bg-slate-50",
                )}
              >
                <Square className="h-4 w-4" />
                <span>{isDrawingMode ? "Cancel Drawing" : "Draw Box"}</span>
              </Button>
              {selectedBoxId && (
                <Button
                  onClick={handleDeleteSelected}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Box</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className={clsx(
          "w-full h-[500px]",
          "flex items-center justify-center",
          " bg-slate-50 overflow-hidden",
        )}
        >
          {image
            ? (
                <ImageViewer
                  src={image}
                  isDrawingMode={isDrawingMode}
                  setIsDrawingMode={setIsDrawingMode}
                  selectedBoxId={selectedBoxId}
                  setSelectedBoxId={setSelectedBoxId}
                  boundingBoxes={boundingBoxes}
                  setBoundingBoxes={setBoundingBoxes}
                />
              )
            : <ImageLoader setImage={setImage} />}
        </div>
      </Card>
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => { }}
          disabled
        >
          Save
        </Button>
      </div>
    </>
  )
}

interface ImageViewerProps {
  src: string
  isDrawingMode: boolean
  setIsDrawingMode: Dispatch<SetStateAction<boolean>>
  selectedBoxId: string | null
  setSelectedBoxId: Dispatch<SetStateAction<string | null>>
  boundingBoxes: BoundingBox[]
  setBoundingBoxes: Dispatch<SetStateAction<BoundingBox[]>>
}

// Ref https://github.com/BetterTyped/react-zoom-pan-pinch/blob/master/src/stories/examples/image-responsive/example.tsx
function ImageViewer({
  src,
  setIsDrawingMode,
  isDrawingMode,
  selectedBoxId,
  setSelectedBoxId,
  boundingBoxes,
  setBoundingBoxes,
}: ImageViewerProps) {
  const scaleUp = true
  //   const backgroundColor = "black"
  const zoomFactor = 30

  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  const [containerWidth, setContainerWidth] = useState<number>(0)
  const [containerHeight, setContainerHeight] = useState<number>(0)

  const [imageNaturalWidth, setImageNaturalWidth] = useState<number>(0)
  const [imageNaturalHeight, setImageNaturalHeight] = useState<number>(0)

  const imageScale = useMemo(() => {
    if (
      containerWidth === 0
      || containerHeight === 0
      || imageNaturalWidth === 0
      || imageNaturalHeight === 0
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
    }
    else {
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
          doubleClick={{ step: 0.7 }}
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
              isDrawingMode={isDrawingMode}
              setIsDrawingMode={setIsDrawingMode}
              selectedBoxId={selectedBoxId}
              setSelectedBoxId={setSelectedBoxId}
              boundingBoxes={boundingBoxes}
              setBoundingBoxes={setBoundingBoxes}
            />
          </TransformComponent>
        </TransformWrapper>
      )}
    </div>
  )
}

interface ImageWithBoundingBoxesProps {
  src: string
  isDrawingMode: boolean
  setIsDrawingMode: Dispatch<SetStateAction<boolean>>
  selectedBoxId: string | null
  setSelectedBoxId: Dispatch<SetStateAction<string | null>>
  boundingBoxes: BoundingBox[]
  setBoundingBoxes: Dispatch<SetStateAction<BoundingBox[]>>
}
function ImageWithBoundingBoxes({
  src,
  isDrawingMode,
  setIsDrawingMode,
  selectedBoxId,
  setSelectedBoxId,
  boundingBoxes,
  setBoundingBoxes,
}: ImageWithBoundingBoxesProps) {
  const transformedComponent = useTransformComponent(({ state, instance: _ }) => {
    return state // { previousScale: 1, scale: 1, positionX: 0, positionY: 0 }
  })
  const scale = transformedComponent.scale
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [tempBox, setTempBox] = useState<
    Omit<BoundingBox, "id" | "prob" | "name" | "class_info"> | null
  >(null)// ({ x: 50, y: 150, width: 100, height: 100 })
  const drawingRef = useRef<{
    isDrawing: boolean
    startX: number
    startY: number
  }>({
    isDrawing: false,
    startX: 0,
    startY: 0,
  })

  // Funciones para dibujar cajas
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawingMode || !imageRef.current)
        return

      const rect = imageRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / scale
      const y = (e.clientY - rect.top) / scale

      drawingRef.current = {
        isDrawing: true,
        startX: x,
        startY: y,
      }

      setTempBox({
        x,
        y,
        width: 0,
        height: 0,
      })
    },
    [isDrawingMode, scale],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!drawingRef.current.isDrawing || !imageRef.current || !tempBox)
        return

      const rect = imageRef.current.getBoundingClientRect()
      const currentX = (e.clientX - rect.left) / scale
      const currentY = (e.clientY - rect.top) / scale

      const width = currentX - drawingRef.current.startX
      const height = currentY - drawingRef.current.startY

      setTempBox({
        x: width >= 0 ? drawingRef.current.startX : currentX,
        y: height >= 0 ? drawingRef.current.startY : currentY,
        width: Math.abs(width),
        height: Math.abs(height),
      })
    },
    [scale, tempBox],
  )

  const handleMouseUp = useCallback(() => {
    if (drawingRef.current.isDrawing && tempBox && tempBox.width > 5 && tempBox.height > 5) {
      setBoundingBoxes(prev => [
        ...prev,
        {
          id: nanoid(),
          name: `box-${Date.now()}`,
          ...tempBox,
          class_info: classesSpectrumDetection[0],
          prob: 1,
        },
      ])
    }

    drawingRef.current.isDrawing = false
    setTempBox(null)
    setIsDrawingMode(false)
  }, [tempBox, setBoundingBoxes, setIsDrawingMode])

  const handleBoxClick = useCallback(
    (e: React.MouseEvent, boxId: string) => {
      e.stopPropagation()
      setSelectedBoxId(boxId === selectedBoxId ? null : boxId)
    },
    [selectedBoxId, setSelectedBoxId],
  )

  return (
    <div
      // ref={containerRef}
      className="relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img
        // className="border-black"
        ref={imageRef}
        src={src}
        alt="Bounding Box Editor"
      />
      {/* Cajas delimitadoras existentes */}
      {boundingBoxes.map(box => (
        <div
          key={box.id}
          className={clsx(
            "absolute border-2 cursor-pointer",
            selectedBoxId === box.id
              ? "border-blue-500"
              : "border-red-500",
          )}
          style={{
            left: `${box.x}px`,
            top: `${box.y}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
            backgroundColor: "rgba(255, 0, 0, 0.1)",
          }}
          onClick={e => handleBoxClick(e, `${box.id}`)}
        />
      ))}
      {/* Caja temporal durante el dibujo */}
      {tempBox && (
        <div
          className="absolute border-2 border-blue-500"
          style={{
            left: `${tempBox.x}px`,
            top: `${tempBox.y}px`,
            width: `${tempBox.width}px`,
            height: `${tempBox.height}px`,
            backgroundColor: "rgba(0, 0, 255, 0.1)",
          }}
        />
      )}
    </div>
  )
}

interface ImageLoaderProps {
  setImage: Dispatch<SetStateAction<string | null>>
}

function ImageLoader({ setImage }: ImageLoaderProps) {
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="w-full h-full p-6 rounded-lg">
      <label
        htmlFor="image-upload"
        className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <p className="mb-2 text-sm text-slate-500">
            <span className="font-semibold">Click to upload an image</span>
          </p>
          <p className="text-xs text-slate-500">PNG, JPG or TIFF</p>
        </div>
        <input
          id="image-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </label>
    </div>
  )
}
