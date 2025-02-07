import type { BoundingBox } from "@/interfaces/BoundingBox"
import { Spectrum } from "@/enums/Spectrum"
import { CustomError, ErrorCodes } from "@/lib/utils"
import * as ort from "onnxruntime-web"
import { useMemo, useState } from "react"

export function usePredictBBs(): (img_src: string) => Promise<BoundingBox[]> {
    const SIZE_M = 1088
    const CLASSES = [Spectrum.Lamp, Spectrum.Science]
    const CONFIDENCE_THRESHOLD = 0.75
    const IOU_THRESHOLD = 0.7
    const modelPath = "/models/spectrum_part_segmentator.onnx"

    const [MODEL, setModel] = useState<ort.InferenceSession | null>(null)

    useMemo(() => {
        ort.InferenceSession.create(modelPath)
            .then(setModel)
            .catch(error => console.error("Error cargando el modelo ONNX:", error))
    }, [modelPath])

    function prepare_input(img_src: string) {
        const image = new Image()
        image.src = img_src

        const canvas = document.createElement("canvas")
        canvas.width = SIZE_M
        canvas.height = SIZE_M
        const context = canvas.getContext("2d")!
        context.drawImage(image, 0, 0, SIZE_M, SIZE_M)

        const data = context.getImageData(0, 0, SIZE_M, SIZE_M).data
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

    async function runInference(session: ort.InferenceSession, input: Float32Array<ArrayBuffer>) {
        const feeds = { images: new ort.Tensor("float32", input, [1, 3, SIZE_M, SIZE_M]) }
        const outputs = await session.run(feeds)
        return outputs
    }

    function processOutputs(outputs: ort.InferenceSession.OnnxValueMapType, image: HTMLImageElement) {
        const { naturalWidth: NATURALWIDTH, naturalHeight: NATURALHEIGHT } = image

        // console.log("salida", outputs.output0.data)
        const DATA = outputs.output0.data as Float32Array
        const COLS = outputs.output0.dims[2]
        const ROWS = outputs.output0.dims[1]

        let boundingBoxes: BoundingBox[] = []
        let id = 0
        for (let column = 0; column < COLS; column++) {
            const [class_id, prob] = [...Array.from({ length: ROWS - 4 }).keys()]
                .map(row => [row, DATA[COLS * (row + 4) + column]])
                .reduce((accum, item) => item[1] > accum[1] ? item : accum, [0, 0])

            if (prob < CONFIDENCE_THRESHOLD) {
                continue
            }

            const label = CLASSES[class_id]
            const xc: number = DATA[COLS * 0 + column]
            const yc: number = DATA[COLS * 1 + column]
            let w: number = DATA[COLS * 2 + column]
            let h: number = DATA[COLS * 3 + column]

            let x1 = (xc - w / 2)
            let y1 = (yc - h / 2)

            // Escalado
            x1 = x1 * (NATURALWIDTH / SIZE_M)
            y1 = y1 * (NATURALHEIGHT / SIZE_M)
            w = w * (NATURALWIDTH / SIZE_M)
            h = h * (NATURALHEIGHT / SIZE_M)

            const boundingBox: BoundingBox = {
                id: id++,
                name: label,
                x: x1,
                y: y1,
                width: w,
                height: h,
                class_name: CLASSES[class_id],
                prob,
            }

            boundingBoxes.push(boundingBox)
        }

        boundingBoxes = boundingBoxes.sort((bb1, bb2) => bb2.prob - bb1.prob)
        const result = []
        while (boundingBoxes.length > 0) {
            result.push(boundingBoxes[0])
            boundingBoxes = boundingBoxes.filter(bb => iou(boundingBoxes[0], bb) < IOU_THRESHOLD)
        }
        return result
    }

    async function determineBBs(img_src: string): Promise<BoundingBox[]> {
        if (!MODEL) {
            throw new CustomError(ErrorCodes.WAITING_MODEL, "El modelo aún no está cargado.")
        }

        const { input, image } = prepare_input(img_src)
        const session: ort.InferenceSession = MODEL
        const outputs: ort.InferenceSession.OnnxValueMapType = await runInference(session, input)
        const processed_output: BoundingBox[] = processOutputs(outputs, image)
        return processed_output
    }

    return determineBBs
}

function iou(box1: BoundingBox, box2: BoundingBox) {
    return intersection(box1, box2) / union(box1, box2)
}

function union(box1: BoundingBox, box2: BoundingBox) {
    const { x: box1_x1, y: box1_y1, width: box1_width, height: box1_height } = box1
    const box1_x2 = box1_x1 + box1_width
    const box1_y2 = box1_y1 + box1_height

    const { x: box2_x1, y: box2_y1, width: box2_width, height: box2_height } = box2
    const box2_x2 = box2_x1 + box2_width
    const box2_y2 = box2_y1 + box2_height

    const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1)
    const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1)
    return box1_area + box2_area - intersection(box1, box2)
}

function intersection(box1: BoundingBox, box2: BoundingBox) {
    const { x: box1_x1, y: box1_y1, width: box1_width, height: box1_height } = box1
    const box1_x2 = box1_x1 + box1_width
    const box1_y2 = box1_y1 + box1_height

    const { x: box2_x1, y: box2_y1, width: box2_width, height: box2_height } = box2
    const box2_x2 = box2_x1 + box2_width
    const box2_y2 = box2_y1 + box2_height

    const x1 = Math.max(box1_x1, box2_x1)
    const y1 = Math.max(box1_y1, box2_y1)
    const x2 = Math.min(box1_x2, box2_x2)
    const y2 = Math.min(box1_y2, box2_y2)
    return (x2 - x1) * (y2 - y1)
}
