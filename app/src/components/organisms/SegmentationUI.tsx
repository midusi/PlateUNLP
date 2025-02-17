import type { BoundingBox } from "@/interfaces/BoundingBox"
import { Button } from "@/components/atoms/button"
import { BBImageEditor } from "@/components/organisms/BBImageEditor"
import { usePredictBBs } from "@/hooks/use-predict-BBs"
import { getNextId } from "@/lib/utils"
import { useState } from "react"

interface SegmentationUIProps {
    file: string
    onComplete: () => void
}

export function SegmentationUI({ file, onComplete }: SegmentationUIProps) {
    const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([])
    const determineBB: (img_src: string) => Promise<BoundingBox[]> = usePredictBBs()

    async function handleAutodetect() {
        const bbAutodetectedPromise = determineBB(file)
        const newBBs: BoundingBox[] = [...boundingBoxes]
        for (const bb of await bbAutodetectedPromise) {
            const newBB = { ...bb, id: getNextId(newBBs) }
            newBBs.push(newBB)
        }
        setBoundingBoxes(newBBs)
    }

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
            <Button
                onClick={() => {
                    handleAutodetect()
                }}
            >
                Autodetect
            </Button>
            <BBImageEditor className="w-full" src={file} boundingBoxes={boundingBoxes} setBoundingBoxes={setBoundingBoxes} enableAutodetect />
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
