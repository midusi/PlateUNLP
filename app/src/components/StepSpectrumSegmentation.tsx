import type { ChangeEvent } from "react"
import { useState } from "react"
import { BBImageEditor } from "./BBImageEditor"
import { Uploader } from "./Uploader"

type LoadingState = "waiting" | "processing" | "finished" | "error"

export function StepSpectrumSegmentation() {
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
        <div className="w-full bg-gray-200 p-6">
            {loadingState === "waiting"
                && <Uploader accept=".png,.jpg" onChange={handleFileChange} showInfoDeleteRow={false} />}
            {loadingState === "processing" && <p>Cargando contenido...</p>}
            {loadingState === "finished" && file && (
                <BBImageEditor className="w-full" src={file} />
            )}
            {loadingState === "error" && <p>Error loading image. Please try again.</p>}

        </div>
    )
}
