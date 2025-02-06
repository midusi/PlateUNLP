import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { StepProps } from "@/interfaces/StepProps"
import type { ChangeEvent } from "react"
import { Button } from "@/components/atoms/button"
import { Uploader } from "@/components/molecules/Uploader"
import { BBImageEditor } from "@/components/organisms/BBImageEditor"
import * as ort from "onnxruntime-web"
import { useEffect, useState } from "react"

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

    useEffect(() => {
        // Predecir Bounding Boxes
        determineBB(file)
    }, [])

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

function prepare_input(img_src: string) {
    const image = new Image()
    image.src = img_src

    const canvas = document.createElement("canvas")
    canvas.width = 1088
    canvas.height = 1088
    const context = canvas.getContext("2d")!
    context.drawImage(image, 0, 0, 1088, 1088)

    const data = context.getImageData(0, 0, 1088, 1088).data
    const red: number[] = []
    const green: number[] = []
    const blue: number[] = []
    for (let index = 0; index < data.length; index += 4) {
        red.push(data[index] / 255)
        green.push(data[index + 1] / 255)
        blue.push(data[index + 2] / 255)
    }
    return {
        input: new Float32Array([...red, ...green, ...blue]),
        image,
    }
}

async function loadModel() {
    const model_path = "/models/spectrum_part_segmentator.onnx"
    const session = await ort.InferenceSession.create(model_path)
    return session
}

async function runInference(session: ort.InferenceSession, input: Float32Array<ArrayBuffer>) {
    const feeds = { images: new ort.Tensor("float32", input, [1, 3, 1088, 1088]) }
    const outputs = await session.run(feeds)
    return outputs
}

async function determineBB(img_src: string) {
    const yolo_classes = ["lamp spectrum", "science spectrum"]

    const session: ort.InferenceSession = await loadModel()
    const { input, image } = prepare_input(img_src)
    const outputs: ort.InferenceSession.OnnxValueMapType = await runInference(session, input)
    const processed = processOutputs(outputs, image)
    // console.log("Resultado de la inferencia:", outputs)
}

function processOutputs(outputs: ort.InferenceSession.OnnxValueMapType, image: HTMLImageElement) {
    const { naturalWidth: NATURALWIDTH, naturalHeight: NATURALHEIGHT } = image
    console.log("Hola: ", NATURALHEIGHT, NATURALWIDTH)

    // console.log("salida", outputs.output0.data)
    const DATA = outputs.output0.data
    const COLS = outputs.output0.dims[2]
    const ROWS = outputs.output0.dims[1]
    let column, row
    for (column = 0; column < COLS; column++) {
        const xc = DATA[8400 * 0 + column]
        const yc = DATA[8400 * 1 + column]
        const w = DATA[8400 * 2 + column]
        const h = DATA[8400 * 3 + column]

        // const x1 = (xc - w / 2) / 640 * img_width
        // const y1 = (yc - h / 2) / 640 * img_height
        // const x2 = (xc + w / 2) / 640 * img_width
        // const y2 = (yc + h / 2) / 640 * img_height
    }
    return outputs
}

function iou(box1, box2) {
    return intersection(box1, box2) / union(box1, box2)
}

function union(box1, box2) {
    const [box1_x1, box1_y1, box1_x2, box1_y2] = box1
    const [box2_x1, box2_y1, box2_x2, box2_y2] = box2
    const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1)
    const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1)
    return box1_area + box2_area - intersection(box1, box2)
}

function intersection(box1, box2) {
    const [box1_x1, box1_y1, box1_x2, box1_y2] = box1
    const [box2_x1, box2_y1, box2_x2, box2_y2] = box2
    const x1 = Math.max(box1_x1, box2_x1)
    const y1 = Math.max(box1_y1, box2_y1)
    const x2 = Math.min(box1_x2, box2_x2)
    const y2 = Math.min(box1_y2, box2_y2)
    return (x2 - x1) * (y2 - y1)
}
