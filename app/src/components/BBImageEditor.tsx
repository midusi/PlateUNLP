import { Pane, ResizablePanes } from "resizable-panes-react"
import { Button } from "./ui/button"

interface BBImageEditorProps {
    className: string
    src: string
}

export function BBImageEditor({ className, src }: BBImageEditorProps) {
    return (
        <ResizablePanes
            vertical
            uniqueId="uniqueId"
            resizerSize={5}
            resizerClass="w-full bg-gradient-to-t from-sky-300 to-sky-200 border-2 border-gray-300 rounded-md flex justify-center items-center"
        >
            <Pane id="P0" size={80} minSize={20} className="bg-black">
                <img className={className} src={src} />
            </Pane>
            <Pane id="P1" size={20} minSize={10} className="bg-gray-100 flex flex-col items-center space-y-2 p-2">
                <Button
                    className="w-32"
                    onClick={() => { }}
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
