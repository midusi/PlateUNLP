import { useEffect, useRef, useState } from "react"
import { Pane, ResizablePanes } from "resizable-panes-react"
import { Button } from "./ui/button"

interface BBImageEditorProps {
    className: string
    src: string
}

interface BoundingBox {
    id: number
    x: number
    y: number
    width: number
    height: number
}

function useImageScale(imageRef: React.RefObject<HTMLImageElement>) {
    const [scale, setScale] = useState({ x: 1, y: 1 })

    useEffect(() => {
        const image = imageRef.current

        function updateScale() {
            if (image) {
                setScale({
                    x: image.offsetWidth / image.naturalWidth,
                    y: image.offsetHeight / image.naturalHeight,
                })
            }
        }

        updateScale()

        // ResizeObserver para monitorear cambios en el tamaño del contenedor de la imagen.
        const observer = new ResizeObserver(() => updateScale())
        if (image) {
            observer.observe(image)
        }

        return () => {
            if (image) {
                observer.unobserve(image)
            }
            observer.disconnect()
        }
    }, [imageRef])

    return scale
}

function useBoundingBoxesDrag(
    imageRef: React.RefObject<HTMLImageElement>,
    scale: { x: number, y: number },
    setBoundingBoxes: React.Dispatch<React.SetStateAction<BoundingBox[]>>,
) {
    const [draggedBB, setDraggedBB] = useState<number | null>(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    function startDragging(event: React.MouseEvent, box: BoundingBox) {
        const image = imageRef.current
        if (image) {
            const rect = image.getBoundingClientRect()
            const offsetX = event.clientX - rect.left - box.x * scale.x
            const offsetY = event.clientY - rect.top - box.y * scale.y

            setDraggedBB(box.id)
            setDragOffset({ x: offsetX / scale.x, y: offsetY / scale.y })
        }
    }

    function handleDragging(event: React.MouseEvent) {
        if (draggedBB !== null) {
            const image = imageRef.current
            if (image) {
                const rect = image.getBoundingClientRect()
                const mouseX = (event.clientX - rect.left) / scale.x
                const mouseY = (event.clientY - rect.top) / scale.y

                setBoundingBoxes(prev =>
                    prev.map(box =>
                        box.id === draggedBB
                            ? {
                                ...box,
                                x: Math.max(0, Math.min(mouseX - dragOffset.x, image.naturalWidth - box.width)),
                                y: Math.max(0, Math.min(mouseY - dragOffset.y, image.naturalHeight - box.height)),
                            }
                            : box,
                    ),
                )
            }
        }
    }

    function stopDragging() {
        setDraggedBB(null)
    }

    return { draggedBB, startDragging, handleDragging, stopDragging }
}

interface BoundingBoxElementProps {
    box: BoundingBox
    scale: { x: number, y: number }
    selected: boolean
    dragged: boolean
    onClick: () => void
    onDragStart: (event: React.MouseEvent) => void
    onDrag: (event: React.MouseEvent) => void
    onDragEnd: () => void
    onResizeStart: (event: React.MouseEvent, direction: string) => void
}

function BoundingBoxElement({
    box,
    scale,
    selected,
    dragged,
    onClick,
    onDragStart,
    onDrag,
    onDragEnd,
    onResizeStart,
}: BoundingBoxElementProps) {
    const { id: boxId, x: boxX, y: boxY, width: boxWidth, height: boxHeight } = box
    const { x: scaleX, y: scaleY } = scale

    const resizeHandles = [
        { direction: "nw", style: { left: -5, top: -5, cursor: "nwse-resize" } },
        { direction: "n", style: { left: "50%", top: -5, transform: "translateX(-50%)", cursor: "ns-resize" } },
        { direction: "ne", style: { right: -5, top: -5, cursor: "nesw-resize" } },
        { direction: "e", style: { right: -5, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" } },
        { direction: "se", style: { right: -5, bottom: -5, cursor: "nwse-resize" } },
        { direction: "s", style: { left: "50%", bottom: -5, transform: "translateX(-50%)", cursor: "ns-resize" } },
        { direction: "sw", style: { left: -5, bottom: -5, cursor: "nesw-resize" } },
        { direction: "w", style: { left: -5, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" } },
    ]

    return (
        <div
            key={boxId}
            style={{
                position: "absolute",
                left: `${boxX * scaleX}px`,
                top: `${boxY * scaleY}px`,
                width: `${boxWidth * scaleX}px`,
                height: `${boxHeight * scaleY}px`,
                border: `2px solid ${selected
                    ? "orange"
                    : "red"}`,
                cursor: dragged ? "grabbing" : "grab",
                boxSizing: "border-box",
            }}
            onMouseDown={onDragStart}
            onMouseMove={onDrag}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onClick={onClick}
        >
            {selected && resizeHandles.map(handle => (
                <div
                    key={handle.direction}
                    onMouseDown={event => onResizeStart(event, handle.direction)}
                    style={{
                        position: "absolute",
                        width: 10,
                        height: 10,
                        background: "rgba(0, 0, 0, 0.5)",
                        ...handle.style,
                    }}
                />
            ))}
        </div>
    )
}

export function BBImageEditor({ className, src }: BBImageEditorProps) {
    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([])
    const [selectedBB, setSelectedBB] = useState<number | null>(null)
    const [nextId, setNextId] = useState<number>(1)

    const imageRef = useRef<HTMLImageElement>(null)
    const scale = useImageScale(imageRef)

    // Arrastre de Bounding Boxes
    const { draggedBB, startDragging, handleDragging, stopDragging } = useBoundingBoxesDrag(imageRef, scale, setBoundingBoxes)

    const [resizingBB, setResizingBB] = useState<number | null>(null)
    const [resizeDirection, setResizeDirection] = useState<string | null>(null)

    function handleResizeStart(event: React.MouseEvent, direction: string) {
        if (selectedBB !== null) {
            setResizingBB(selectedBB)
            setResizeDirection(direction)
        }
        event.stopPropagation() // Evita que active la lógica de arrastre
    };

    function handleResizing(event: React.MouseEvent) {
        if (resizingBB !== null && resizeDirection) {
            const image = imageRef.current
            if (image) {
                const rect = image.getBoundingClientRect()
                const mouseX = (event.clientX - rect.left) / scale.x
                const mouseY = (event.clientY - rect.top) / scale.y

                setBoundingBoxes(prev =>
                    prev.map((box) => {
                        if (box.id === resizingBB) {
                            let newWidth = box.width
                            let newHeight = box.height
                            let newX = box.x
                            let newY = box.y

                            if (resizeDirection.includes("e")) {
                                newWidth = Math.max(10, mouseX - box.x)
                            }
                            if (resizeDirection.includes("s")) {
                                newHeight = Math.max(10, mouseY - box.y)
                            }
                            if (resizeDirection.includes("w")) {
                                const deltaX = box.x - mouseX
                                newWidth = Math.max(10, box.width + deltaX)
                                newX = box.x - deltaX
                            }
                            if (resizeDirection.includes("n")) {
                                const deltaY = box.y - mouseY
                                newHeight = Math.max(10, box.height + deltaY)
                                newY = box.y - deltaY
                            }

                            return {
                                ...box,
                                x: Math.max(0, newX),
                                y: Math.max(0, newY),
                                width: Math.min(image.naturalWidth - newX, newWidth),
                                height: Math.min(image.naturalHeight - newY, newHeight),
                            }
                        }
                        return box
                    }),
                )
            }
        }
    };

    const handleMouseUp = () => {
        stopDragging()
        setResizingBB(null)
        setResizeDirection(null)
    }

    function addBoundingBox() {
        const newBox: BoundingBox = {
            id: nextId,
            x: 50,
            y: 50,
            width: 100,
            height: 100,
        }
        setBoundingBoxes([...boundingBoxes, newBox])
        setNextId(nextId + 1)
        if (!selectedBB) {
            setSelectedBB(newBox.id)
        }
    };

    function removeBoundingBox(id: number | null) {
        if (selectedBB) {
            setBoundingBoxes(boundingBoxes.filter(box => box.id !== id))
            boundingBoxes[0] ? setSelectedBB(boundingBoxes[0]!.id) : setSelectedBB(null)
        }
    };

    return (
        <ResizablePanes
            vertical
            uniqueId="uniqueId"
            resizerSize={5}
            resizerClass="w-full bg-gradient-to-t from-sky-300 to-sky-200 border-2 border-gray-300 rounded-md flex justify-center items-center"
        >
            <Pane id="P0" size={80} minSize={20} className="bg-black">
                <div
                    className="relative"
                    onMouseMove={(event) => {
                        handleDragging(event)
                        handleResizing(event)
                    }}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <img className={className} ref={imageRef} src={src} alt="Bounding Box Editor" />
                    {/* Dibujar las Bounding Boxes */}
                    {boundingBoxes.map(box => (
                        <BoundingBoxElement
                            key={box.id}
                            box={box}
                            scale={scale}
                            selected={selectedBB === box.id}
                            dragged={draggedBB === box.id}
                            onClick={() => setSelectedBB(box.id)}
                            onDragStart={event => startDragging(event, box)}
                            onDrag={handleDragging}
                            onDragEnd={stopDragging}
                            onResizeStart={handleResizeStart}
                        />
                    ))}
                </div>
            </Pane>
            <Pane id="P1" size={20} minSize={10} className="bg-gray-100 flex flex-col items-center space-y-2 p-2">
                <Button
                    className="w-32"
                    onClick={addBoundingBox}
                >
                    +BB
                </Button>
                <Button
                    className="w-32"
                    onClick={() => { selectedBB && removeBoundingBox(selectedBB) }}
                >
                    -BB
                </Button>
            </Pane>
        </ResizablePanes>
    )
}
