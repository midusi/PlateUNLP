import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { Dispatch, SetStateAction } from "react"
import { classesSpectrumDetection } from "@/enums/BBClasses"
import clsx from "clsx"
import { nanoid } from "nanoid"
import { useCallback, useRef, useState } from "react"
import { useTransformComponent } from "react-zoom-pan-pinch"

/**
 * Mapeo de esquinas y aristas al rotar una imagen X grados.
 * @constant
 * @type {Record<number, Record<string, string>>}
 * @default
 */
const rotatedHandleMap: Record<number, Record<string, string>> = {
  0: {
    "top-left": "top-left",
    "top": "top",
    "top-right": "top-right",
    "right": "right",
    "bottom-right": "bottom-right",
    "bottom": "bottom",
    "bottom-left": "bottom-left",
    "left": "left",
  },
  90: {
    "top-left": "bottom-left",
    "top": "left",
    "top-right": "top-left",
    "right": "top",
    "bottom-right": "top-right",
    "bottom": "right",
    "bottom-left": "bottom-right",
    "left": "bottom",
  },
  180: {
    "top-left": "bottom-right",
    "top": "bottom",
    "top-right": "bottom-left",
    "right": "left",
    "bottom-right": "top-left",
    "bottom": "top",
    "bottom-left": "top-right",
    "left": "right",
  },
  270: {
    "top-left": "top-right",
    "top": "right",
    "top-right": "bottom-right",
    "right": "bottom",
    "bottom-right": "bottom-left",
    "bottom": "left",
    "bottom-left": "top-left",
    "left": "top",
  },
}

/**
 * Listado de props que espera recibir ImageWithBoundingBoxesProps
 * @interface ImageWithBoundingBoxes
 */
interface ImageWithBoundingBoxesProps {
  src: string
  rotation: number
  bgWhite: boolean
  isDrawingMode: boolean
  setIsDrawingMode: Dispatch<SetStateAction<boolean>>
  isResizing: boolean
  setIsResizing: Dispatch<SetStateAction<boolean>>
  setIsDragging: Dispatch<SetStateAction<boolean>>
  dragOffsetRef: React.MutableRefObject<{ x: number, y: number }>
  selectedBoxId: string | null
  setSelectedBoxId: Dispatch<SetStateAction<string | null>>
  boundingBoxes: BoundingBox[]
  setBoundingBoxes: Dispatch<SetStateAction<BoundingBox[]>>
}

/**
 * Codifica una imagen con una combinacion de elementos visuales que representan cajas
 * delimitadoras y sus componentes.
 * @param {ImageViewerProps} param0 - Configuaracion y variables/funciones necesarias.
 * @returns - JSX que codifica el componente.
 */
export function ImageWithBoundingBoxes({
  src,
  rotation,
  bgWhite,
  isDrawingMode,
  setIsDrawingMode,
  isResizing,
  setIsResizing,
  setIsDragging,
  dragOffsetRef,
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

  // State for resize handling
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const resizeRef = useRef<{
    startX: number
    startY: number
    originalBox: BoundingBox | null
  }>({
    startX: 0,
    startY: 0,
    originalBox: null,
  })

  const transformCoordinates = useCallback(
    (x: number, y: number, width: number, height: number, reverse = false) => {
      const rot = reverse ? (360 - rotation) % 360 : rotation

      // Si no hay imagen o no hay rotación no hay necesidad de tranformar las cordenadas
      if (!imageRef.current || rot === 0)
        return { x, y, width, height }

      // Centro respecto al tamaño natural de la imagen
      const centerX = imageRef.current.clientWidth / 2
      const centerY = imageRef.current.clientHeight / 2

      // Cordenadas relativas al centro de la imagen
      // let diff = 0
      // if (rotation === 90 || rotation === 270) {
      //   diff = (imageRef.current.clientWidth - imageRef.current.clientHeight) / 2
      // }
      const relX = x - centerX // + diff
      const relY = y - centerY

      // Default: Asumimos posicion en centro absoluto luego
      // sumamos la modificacion correspondiente en x e y
      const newPos = { x: centerX, y: centerY, width, height }
      if (rot === 90) {
        // Rotar 90 grados
        newPos.x += -relY - height // (- height) rotacion de punto principal
        newPos.y += relX
        newPos.width = height
        newPos.height = width
      }
      else if (rot === 180) {
        // Rotar 180 grados
        newPos.x += -relX - width // (- width) rotacion de punto principal
        newPos.y += -relY - height // (- height) rotacion de punto principal
      }
      else if (rot === 270) {
        // Rotar 270 grados
        newPos.x += relY
        newPos.y += -relX - width // (- width) rotacion de punto principal
        newPos.width = height
        newPos.height = width
      }

      return newPos
    },
    [rotation, imageRef],
  )

  /**
   * Función para transformar deltas según la rotación
   */
  const transformDeltas = useCallback(
    (deltaX: number, deltaY: number) => {
      const rot = rotation % 360

      if (rot === 0) {
        return { deltaX, deltaY }
      }
      else if (rot === 90) {
        return { deltaX: -deltaY, deltaY: deltaX }
      }
      else if (rot === 180) {
        return { deltaX: -deltaX, deltaY: -deltaY }
      }
      else if (rot === 270) {
        return { deltaX: deltaY, deltaY: -deltaX }
      }

      return { deltaX, deltaY }
    },
    [rotation],
  )

  // Funciones para dibujar cajas
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current)
        return
      if (isResizing)
        return
      if (!isDrawingMode)
        return

      const rect = imageRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / scale
      const y = (e.clientY - rect.top) / scale

      // Transforma las cordenadas para obtener la poscicion base original
      const basePos = transformCoordinates(x, y, 0, 0, true)

      drawingRef.current = {
        isDrawing: true,
        startX: basePos.x,
        startY: basePos.y,
      }

      setTempBox({
        x: basePos.x,
        y: basePos.y,
        width: 0,
        height: 0,
      })
    },
    [isDrawingMode, isResizing, scale, transformCoordinates],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current)
        return
      const rect = imageRef.current.getBoundingClientRect()
      let currentX = (e.clientX - rect.left) / scale
      let currentY = (e.clientY - rect.top) / scale

      // Transformar coordenadas según la rotación
      const transformed = transformCoordinates(currentX, currentY, 0, 0, true)
      currentX = transformed.x
      currentY = transformed.y
      const box_selected = boundingBoxes.find(b => b.id === selectedBoxId)
      if ((selectedBoxId && !isResizing && !isDrawingMode && e.buttons === 1 && box_selected !== undefined)) {
        if (dragOffsetRef.current.x === -1) {
          const offsetX = currentX - box_selected.x
          const offsetY = currentY - box_selected.y
          dragOffsetRef.current = { x: offsetX, y: offsetY }
        }
        setIsDragging(true)
        const newBox = { ...box_selected }
        newBox.x = currentX - dragOffsetRef.current.x // - previousMouseX
        newBox.y = currentY - dragOffsetRef.current.y // - previousMouseY
        // Update the bounding box
        setBoundingBoxes(prev => prev.map(box => (box.id === selectedBoxId ? newBox : box)))
      }
      else {
        dragOffsetRef.current = { x: -1, y: 0 }
        setIsDragging(false)
      }
      /** Dibujo de nueva caja */
      if (drawingRef.current.isDrawing && tempBox) {
        const width = currentX - drawingRef.current.startX
        const height = currentY - drawingRef.current.startY

        setTempBox({
          x: width >= 0 ? drawingRef.current.startX : currentX,
          y: height >= 0 ? drawingRef.current.startY : currentY,
          width: Math.abs(width),
          height: Math.abs(height),
        })
      }
      /** Redimensionado de caja */
      else if (selectedBoxId && isResizing && resizeHandle && resizeRef.current.originalBox) {
        const originalBox = resizeRef.current.originalBox

        // Calcular deltas en coordenadas de pantalla
        let deltaX = currentX - resizeRef.current.startX
        let deltaY = currentY - resizeRef.current.startY

        // Transformar los deltas según la rotación actual
        const transformedDeltas = transformDeltas(deltaX, deltaY)
        deltaX = transformedDeltas.deltaX
        deltaY = transformedDeltas.deltaY

        const newBox = { ...originalBox }

        // const centerX = imageRef.current.width / 2
        // const centerY = imageRef.current.height / 2

        const actualHandle = rotatedHandleMap[rotation][resizeHandle]

        switch (actualHandle) {
          case "top-left":
            newBox.x = currentX
            newBox.y = currentY
            newBox.width = originalBox.width - (currentX - originalBox.x)
            newBox.height = originalBox.height - (currentY - originalBox.y)
            break
          case "top-right":
            newBox.y = currentY
            newBox.width = currentX - originalBox.x
            newBox.height = originalBox.height - (currentY - originalBox.y)
            break
          case "bottom-left":
            newBox.x = currentX
            newBox.width = originalBox.width - (currentX - originalBox.x)
            newBox.height = currentY - originalBox.y
            break
          case "bottom-right":
            newBox.width = currentX - originalBox.x
            newBox.height = currentY - originalBox.y
            break
          case "top":
            newBox.y = currentY
            newBox.height = originalBox.height - (currentY - originalBox.y)
            break
          case "right":
            newBox.width = currentX - originalBox.x
            break
          case "bottom":
            newBox.height = currentY - originalBox.y
            break
          case "left":
            newBox.x = currentX
            newBox.width = originalBox.width - (currentX - originalBox.x)
            break
        }

        // Minimo 5*5 newBox size
        if (newBox.width < 5) {
          if (resizeHandle.includes("left")) {
            newBox.x = originalBox.x + originalBox.width - 5
          }
          newBox.width = 5
        }
        if (newBox.height < 5) {
          if (resizeHandle.includes("top")) {
            newBox.y = originalBox.y + originalBox.height - 5
          }
          newBox.height = 5
        }

        // Update the bounding box
        setBoundingBoxes(prev => prev.map(box => (box.id === selectedBoxId ? newBox : box)))
      }
    },
    [
      scale,
      transformCoordinates,
      boundingBoxes,
      selectedBoxId,
      isResizing,
      isDrawingMode,
      tempBox,
      resizeHandle,
      dragOffsetRef,
      setIsDragging,
      setBoundingBoxes,
      transformDeltas,
      rotation,
    ],
  )

  const handleMouseUp = useCallback(() => {
    // Complete drawing
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

    // Complete resize
    if (isResizing) {
      setIsResizing(false)
      setResizeHandle(null)
      resizeRef.current.originalBox = null
    }
  }, [tempBox, setIsDrawingMode, isResizing, setBoundingBoxes, setIsResizing])

  const handleBoxClick = useCallback(
    (e: React.MouseEvent, boxId: string) => {
      e.stopPropagation()
      setSelectedBoxId(boxId === selectedBoxId ? null : boxId)
    },
    [selectedBoxId, setSelectedBoxId],
  )

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, boxId: string, handle: string) => {
      e.stopPropagation()
      e.preventDefault()

      if (!imageRef.current) {
        return
      }

      const box = boundingBoxes.find(b => b.id === boxId)

      const rect = imageRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left / scale
      const y = e.clientY - rect.left / scale

      // Transformar coordenadas según la rotación
      const transformed = transformCoordinates(x, y, 0, 0, true)

      resizeRef.current = {
        startX: transformed.x,
        startY: transformed.y,
        originalBox: { ...box! },
      }

      setIsResizing(true)
      setResizeHandle(handle)
      setSelectedBoxId(boxId)
    },
    [boundingBoxes, scale, setIsResizing, setSelectedBoxId, transformCoordinates],

  )

  /**
   * Renderiza controles de redimensionado sobre los bordes de una caja delimitadora.
   * @param box - Caja delimitadora sobre la que se dibujaran los controles.
   * @returns - Código HTML correspondiente a los controles
   */
  const renderResizeHandles = (box: BoundingBox) => {
    if (box.id !== selectedBoxId) {
      return
    }

    const handleSize = 8
    const handleOffset = -handleSize / 2

    const handles = [
      { name: "top-left", style: { top: handleOffset, left: handleOffset } },
      { name: "top-right", style: { top: handleOffset, right: handleOffset } },
      { name: "bottom-left", style: { bottom: handleOffset, left: handleOffset } },
      { name: "bottom-right", style: { bottom: handleOffset, right: handleOffset } },
      { name: "top", style: { top: handleOffset, left: "50%", transform: "translateX(-50%)" } },
      { name: "right", style: { top: "50%", right: handleOffset, transform: "translateY(-50%)" } },
      { name: "bottom", style: { bottom: handleOffset, left: "50%", transform: "translateX(-50%)" } },
      { name: "left", style: { top: "50%", left: handleOffset, transform: "translateY(-50%)" } },
    ]

    return handles.map(handle => (
      <div
        key={handle.name}
        className="absolute w-2 h-2 bg-white border border-blue500 rounded-sm cursor-pointer"
        style={{
          ...handle.style,
          cursor: handle.name.includes("top-left") || handle.name.includes("bottom-right")
            ? "nwse-resize"
            : handle.name.includes("top-right") || handle.name.includes("bottom-left")
              ? "nesw-resize"
              : handle.name.includes("left") || handle.name.includes("right")
                ? "ew-resize"
                : "ns-resize",
          zIndex: 10,
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
          handleResizeStart(e, box.id.toString(), handle.name)
        }}
      />
    ))
  }

  // Renderizar una caja con la rotación aplicada
  const renderBox = (box: BoundingBox, isTemp = false) => {
    // Transformar las coordenadas según la rotación actual
    const transformed = transformCoordinates(box.x, box.y, box.width, box.height)

    return (
      <div
        key={isTemp ? "temp-box" : box.id}
        className={clsx(
          "absolute border-2",
          isTemp
            ? "border-blue-500"
            : selectedBoxId === box.id
              ? "border-blue-500 cursor-pointer"
              : "border-red-500 cursor-pointer",
        )}
        style={{
          left: `${transformed.x}px`,
          top: `${transformed.y}px`,
          width: `${transformed.width}px`,
          height: `${transformed.height}px`,
          backgroundColor: isTemp ? "rgba(0, 0, 255, 0.1)" : "rgba(255, 0, 0, 0.1)",
        }}
        onClick={isTemp ? undefined : e => handleBoxClick(e, `${box.id}`)}
      >
        {!isTemp && renderResizeHandles(box)}
        {/* Mostrar dimensiones para la caja seleccionada
            {!isTemp && selectedBoxId === box.id && (
              <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-tl">
                {Math.round(box.width)} × {Math.round(box.height)}
              </div>
            )} */}
      </div>
    )
  }

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
        style={{
          transform: `rotate(${rotation}deg)`,
          filter: bgWhite ? "none" : "invert(1)",
          transition: "filter 0.3s ease",
        }}
      />
      {/* Contenedor para las cajas delimitadoras */}
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          // pointerEvents: "none", // Para que los eventos pasen a través al contenedor principal
        }}
      >
        {/* Cajas delimitadoras existentes */}
        {boundingBoxes.map(box => renderBox(box))}

        {/* Caja temporal durante el dibujo */}
        {tempBox && renderBox(tempBox as BoundingBox, true)}
      </div>
    </div>
  )
}
