import { useState } from "react"
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
    const [nextId, setNextId] = useState(1)

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
    };

    function removeBoundingBox(id: number) {
        setBoundingBoxes(boundingBoxes.filter(box => box.id !== id))
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
                    <img className={className} src={src} alt="Bounding Box Editor" />
                    {/* Dibujar las Bounding Boxes */}
                    {boundingBoxes.map(box => (
                        <div
                            key={box.id}
                            style={{
                                position: "absolute",
                                left: `${box.x}px`,
                                top: `${box.y}px`,
                                width: `${box.width}px`,
                                height: `${box.height}px`,
                                border: "2px solid red",
                                cursor: "pointer",
                                boxSizing: "border-box",
                            }}
                            onClick={() => removeBoundingBox(box.id)}
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
                    onClick={() => { }}
                >
                    -BB
                </Button>
            </Pane>
        </ResizablePanes>
    )
}
