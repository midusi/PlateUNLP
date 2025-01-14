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

export function BBImageEditor({ className, src }: BBImageEditorProps) {
    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([])
    const [selectedBB, setSelectedBB] = useState<number | null>(null)
    const [nextId, setNextId] = useState<number>(1)

    const imageRef = useRef<HTMLImageElement>(null)
    const [scale, setScale] = useState({ x: 1, y: 1 })

    // Arrastre de Bounding Boxes
    const [draggingBB, setDraggingBB] = useState<number | null>(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    function startDragging(event: React.MouseEvent, box: BoundingBox) {
        const image = imageRef.current
        if (image) {
            const rect = image.getBoundingClientRect()
            const offsetX = event.clientX - rect.left - box.x * scale.x
            const offsetY = event.clientY - rect.top - box.y * scale.y

            setDraggingBB(box.id)
            setDragOffset({ x: offsetX / scale.x, y: offsetY / scale.y })
        }
    }

    function handleDragging(event: React.MouseEvent) {
        if (draggingBB !== null) {
            const image = imageRef.current
            if (image) {
                const rect = image.getBoundingClientRect()
                const mouseX = (event.clientX - rect.left) / scale.x
                const mouseY = (event.clientY - rect.top) / scale.y

                setBoundingBoxes(prev =>
                    prev.map(box =>
                        box.id === draggingBB
                            ? { ...box, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }
                            : box,
                    ),
                )
            }
        }
    }

    function stopDragging() {
        setDraggingBB(null)
    }

    useEffect(() => {
        function updateScale() {
            const image = imageRef.current
            if (image) {
                setScale({
                    x: image.offsetWidth / image.naturalWidth,
                    y: image.offsetHeight / image.naturalHeight,
                })
            }
        }
        updateScale()
        window.addEventListener("resize", updateScale)
        return () => window.removeEventListener("resize", updateScale)
    }, [])

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
                <div className="relative">
                    <img className={className} ref={imageRef} src={src} alt="Bounding Box Editor" />
                    {/* Dibujar las Bounding Boxes */}
                    {boundingBoxes.map(box => (
                        <div
                            key={box.id}
                            style={{
                                position: "absolute",
                                left: `${box.x * scale.x}px`,
                                top: `${box.y * scale.y}px`,
                                width: `${box.width * scale.x}px`,
                                height: `${box.height * scale.y}px`,
                                border: `2px solid 
                                    ${selectedBB === box.id
                                        ? "orange"
                                        : "red"}`,
                                cursor: "pointer",
                                boxSizing: "border-box",
                            }}
                            onMouseDown={event => startDragging(event, box)}
                            onMouseMove={handleDragging}
                            onMouseUp={stopDragging}
                            onMouseLeave={stopDragging}
                            onClick={() => setSelectedBB(box.id)}
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
