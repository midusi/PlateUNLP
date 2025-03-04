import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { ProcessInfoForm, StepSpecificInfoForm } from "@/interfaces/ProcessInfoForm"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/atoms/button"
import { BBImageEditor } from "@/components/organisms/BBImageEditor"

interface SegmentationUIProps {
    file: string
    onComplete: () => void
    enableAutodetect: boolean
    boundingBoxes: BoundingBox[]
    setBoundingBoxes: Dispatch<SetStateAction<BoundingBox[]>>
    setProcessInfo: Dispatch<SetStateAction<ProcessInfoForm>>
}

export function SegmentationUI({
    file,
    onComplete,
    enableAutodetect,
    boundingBoxes,
    setBoundingBoxes,
    setProcessInfo,
}: SegmentationUIProps) {
    async function saveImages() {
        if (!file || boundingBoxes.length === 0)
            return

        const croppedImages: string[] = []

        // Cargar imagen
        const image = new Image()
        image.src = file
        await new Promise((resolve) => {
            image.onload = resolve
        })

        // Informacion de escala
        const { naturalWidth, naturalHeight, width, height } = image
        const scaleX = naturalWidth / width
        const scaleY = naturalHeight / height

        boundingBoxes.forEach((box) => {
            croppedImages.push(trimImageToBase64(image, box, { x: scaleX, y: scaleY }))
        })

        setProcessInfo(prev => ({
            ...prev,
            spectrums: croppedImages.map((image, index) => ({
                id: index,
                name: `Plate${index}#Spectrum`,
                image,
                complete: totalStepsCompleted(index, prev.perSpectrum),

            })),
        }))
    }

    return (
        <>
            <BBImageEditor
                className="w-full"
                src={file}
                boundingBoxes={boundingBoxes}
                setBoundingBoxes={setBoundingBoxes}
                enableAutodetect={enableAutodetect}
            />
            <div className="flex justify-center pt-4">
                <Button
                    onClick={() => {
                        saveImages()
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

function trimImageToBase64(
    image: HTMLImageElement,
    box: BoundingBox,
    scale: { x: number, y: number },
): string {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    const realX = box.x * scale.x
    const realY = box.y * scale.y
    const realWidth = box.width * scale.x
    const realHeight = box.height * scale.y

    canvas.width = realWidth
    canvas.height = realHeight

    ctx!.drawImage(
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

    return canvas.toDataURL("image/png")
}

function totalStepsCompleted(spectrumId: number, steps: StepSpecificInfoForm[]): number {
    let stepsCompleted = 0
    // Recorrer etapas por las que tiene que pasar un espectro
    for (let stepId = 0; stepId < steps.length; stepId++) {
        // Revisa valor del espectro en etapa i y suma si esta completado
        if (steps[stepId].states![spectrumId] === "COMPLETE") {
            stepsCompleted += 1
        }
    }
    return stepsCompleted
}
