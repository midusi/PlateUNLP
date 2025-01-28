import type { StepProps } from "@/interfaces/StepProps"
import type { ChangeEvent } from "react"
import { useState } from "react"
import { BBImageEditor } from "./BBImageEditor"
import { Button } from "./ui/button"
import { Uploader } from "./Uploader"

type LoadingState = "waiting" | "processing" | "finished" | "error"

export function StepSpectrumSegmentation({ onComplete }: StepProps) {
    const [loadingState, setLoadingState] = useState<LoadingState>("waiting")
    const [file, setFile] = useState<string | null>(null)

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setLoadingState("processing")
            const file = event.target.files[0]
            if (!["image/png", "image/jpeg"].includes(file.type)) {
                setLoadingState("error")
                return
            }
            setFile(URL.createObjectURL(file))
            setLoadingState("finished")
        }
    }

    return (
        <div className="w-full p-6">
            {loadingState === "waiting"
                && <Uploader accept=".png,.jpg" onChange={handleFileChange} showInfoDeleteRow={false} />}
            {loadingState === "error" && <p>Error loading image. Please try again.</p>}
            {loadingState === "processing" && <p>Cargando contenido...</p>}
            {loadingState === "finished" && file
                && <SegmentationUI file={file} onComplete={onComplete} />}
        </div>
    )
}

interface SegmentationUIProps {
    file: string
    onComplete: () => void
}

function SegmentationUI({ file, onComplete }: SegmentationUIProps) {
    return (
        <>
            <BBImageEditor className="w-full" src={file} />
            <div className="flex justify-center pt-4">
                <Button
                    onClick={() => {
                        onComplete()
                    }}
                    disabled={file === null}
                >
                    Save
                </Button>
            </div>
        </>
    )
}
