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
                alert("Por favor, sube una imagen válida (PNG o JPG)")
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
                        console.error("Error al procesar la imagen:", error)
                        setLoadingState("error")
                    }
                }
            }
            reader.onerror = () => {
                console.error("Error al leer el archivo")
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
                    <p>Imagen cargada:</p>
                    <img src={file} alt="Imagen subida" style={{ maxWidth: "100%", maxHeight: "300px" }} />
                </div>
            )}
            {loadingState === "error" && <p>Error al cargar la imagen. Por favor, inténtalo de nuevo.</p>}

        </>
    )
}
