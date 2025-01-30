import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { StepProps } from "@/interfaces/StepProps"
import type { ChangeEvent } from "react"
import { useState } from "react"
import { Button } from "../atoms/button"
import { Uploader } from "../molecules/Uploader"
import { BBImageEditor } from "../organisms/BBImageEditor"

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
    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([])

    async function handleDownload() {
        if (!file || boundingBoxes.length === 0)
            return

        const image = new Image()
        image.src = file

        // Esperar a que la imagen se cargue completamente
        await new Promise((resolve) => {
            image.onload = resolve
        })

        const { naturalWidth, naturalHeight, width, height } = image
        const scaleX = naturalWidth / width
        const scaleY = naturalHeight / height

        // Crear un canvas para cada bounding box y generar las descargas
        boundingBoxes.forEach((box) => {
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            if (ctx) {
                const realX = box.x * scaleX
                const realY = box.y * scaleY
                const realWidth = box.width * scaleX
                const realHeight = box.height * scaleY

                canvas.width = realWidth
                canvas.height = realHeight

                ctx.drawImage(
                    image,
                    realX, // Coordenada X en la imagen real
                    realY, // Coordenada Y en la imagen real
                    realWidth, // Ancho real de la bounding box
                    realHeight, // Alto real de la bounding box
                    0,
                    0,
                    realWidth,
                    realHeight,
                )

                // Convertir el canvas a una URL de descarga
                const link = document.createElement("a")
                link.download = `#${box.id}-${box.name}.png`
                link.href = canvas.toDataURL("image/png")
                link.click()
            }
        })
    }

    return (
        <>
            <BBImageEditor className="w-full" src={file} boundingBoxes={boundingBoxes} setBoundingBoxes={setBoundingBoxes} />
            <div className="flex justify-center pt-4">
                <Button
                    onClick={() => {
                        handleDownload()
                        onComplete()
                    }}
                    disabled={file === null || boundingBoxes.length === 0}
                >
                    Save
                </Button>
            </div>
        </>
    )
}
