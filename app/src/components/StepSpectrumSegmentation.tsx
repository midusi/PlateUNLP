import type { ChangeEvent } from "react"
import { useState } from "react"
import { Uploader } from "./Uploader"

type LoadingState = "waiting" | "processing" | "finished" | "error"

export function StepSpectrumSegmentation() {
    const [loadingState, setLoadingState] = useState<LoadingState>("waiting")
    const [file, setFile] = useState<string | null>(null)

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const file = event.target.files[0]
            if (!["image/png", "image/jpeg"].includes(file.type)) {
                setLoadingState("error")
                return
            }
            setLoadingState("processing")
            const reader = new FileReader()
            reader.readAsArrayBuffer(file)
            reader.onload = () => {
                if (reader.result) {
                    try {
                        setFile(reader.result as string) // Guardar la URL de la imagen
                        setLoadingState("finished")
                    }
                    catch (error) {
                        console.error("Error processing image:", error)
                        setLoadingState("error")
                    }
                }
            }
            reader.onerror = () => {
                console.error("Error reading file")
                setLoadingState("error")
            }
        }
    }

    return (
        <>
            <Uploader accept=".png,.jpg" onChange={handleFileChange} showInfoDeleteRow={false} />
            {loadingState === "processing" && <p>Cargando contenido...</p>}
            {loadingState === "finished" && file && (
                <div>
                    <p>Image uploaded:</p>
                    <img src={file} alt="Image uploaded" style={{ maxWidth: "100%", maxHeight: "300px" }} />
                </div>
            )}
            {loadingState === "error" && <p>Error loading image. Please try again.</p>}

        </>
    )
}
