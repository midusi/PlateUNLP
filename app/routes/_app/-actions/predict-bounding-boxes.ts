import { createServerFn } from "@tanstack/react-start"
import { InferenceSession, Tensor } from "onnxruntime-node"
import sharp from "sharp"
import { z } from "zod"
import { db } from "~/db"
import { readEditedFile } from "~/lib/uploads"
import { iou } from "~/lib/utils"
import type { BBClassesProps } from "~/types/BBClasses"
import type { BoundingBox } from "~/types/BoundingBox"

/**
 * Predecir Bounding Boxes en base a una imagen cruda, desde el backend - migración desde frontend
 * Lógicamente equivalente a usePredictBBs del frontend
 */
export const predictBoundingBoxes = createServerFn()
  .validator(
    z.object({
      observationId: z.string(),
      size: z.number().default(640),
      model: z.string().default("detect_observations.3.0.0.m.onnx"),
      classes: z.array(z.any()),
      forceMaxWidth: z.boolean().optional().default(false),
      confidenceThreshold: z.number().optional().default(0.75),
      iouThreshold: z.number().optional().default(0.7),
    }),
  )
  .handler(async ({ data }) => {
    const SIZE_M = data.size
    const CLASSES = data.classes as BBClassesProps[]
    const CONFIDENCE_THRESHOLD = data.confidenceThreshold
    const IOU_THRESHOLD = data.iouThreshold
    const forceMaxWidth = data.forceMaxWidth

    // Obtener observación/placa
    const observation = await db.query.observation.findFirst({
      where: (t, { eq }) => eq(t.id, data.observationId),
      with: { plate: { with: { image: true } } },
    })
    if (!observation) throw new Error("Observation not found")

    // Obtener imagen
    const image = await readEditedFile(observation.plate)

    // Pre-procesamiento: equivalente a prepare_input del frontend
    const originalMetadata = await sharp(image).metadata()
    const NATURALWIDTH = originalMetadata.width ?? 1
    const NATURALHEIGHT = originalMetadata.height ?? 1

    // Redimensionar a SIZE_M y obtener píxeles RGB
    const { data: rawPixels, info } = await sharp(image)
      .resize(SIZE_M, SIZE_M, { fit: "fill", background: { r: 0, g: 0, b: 0 } })
      .toColorspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { width, height, channels } = info

    // Separar canales RGB y normalizar
    const red: number[] = new Array(SIZE_M * SIZE_M)
    const green: number[] = new Array(SIZE_M * SIZE_M)
    const blue: number[] = new Array(SIZE_M * SIZE_M)
    for (let i = 0; i < SIZE_M * SIZE_M; i++) {
      red[i] = rawPixels[i * 4] / 255
      green[i] = rawPixels[i * 4 + 1] / 255
      blue[i] = rawPixels[i * 4 + 2] / 255
    }

    const input = new Float32Array([...red, ...green, ...blue])

    // Inferencia
    const session = await InferenceSession.create(`./app/models/detect_observations/${data.model}`)
    const feeds = { images: new Tensor("float32", input, [1, 3, SIZE_M, SIZE_M]) }
    const outputs = await session.run(feeds)
    session.release()

    // Post-procesamiento: equivalente a processOutputs del frontend
    const DATA = outputs.output0.data as Float32Array
    const COLS = outputs.output0.dims[2]
    const ROWS = outputs.output0.dims[1]

    let boundingBoxes: BoundingBox[] = []
    let id = 0

    for (let column = 0; column < COLS; column++) {
      const [class_id, prob] = [...Array.from({ length: ROWS - 4 }).keys()]
        .map((row) => [row, DATA[COLS * (row + 4) + column]])
        .reduce((accum, item) => (item[1] > accum[1] ? item : accum), [0, 0])

      if (prob < CONFIDENCE_THRESHOLD) {
        continue
      }

      const xc: number = DATA[COLS * 0 + column]
      const yc: number = DATA[COLS * 1 + column]
      let w: number = DATA[COLS * 2 + column]
      let h: number = DATA[COLS * 3 + column]

      let x1 = xc - w / 2
      let y1 = yc - h / 2

      // Escalado al espacio original
      x1 = x1 * (NATURALWIDTH / SIZE_M)
      y1 = y1 * (NATURALHEIGHT / SIZE_M)
      w = w * (NATURALWIDTH / SIZE_M)
      h = h * (NATURALHEIGHT / SIZE_M)

      if (forceMaxWidth) {
        x1 = 0
        w = NATURALWIDTH
      }

      const boundingBox: BoundingBox = {
        id: id++,
        name: "",
        x: x1,
        y: y1,
        width: w,
        height: h,
        class_info: CLASSES[class_id] as BBClassesProps,
        prob,
      }

      boundingBoxes.push(boundingBox)
    }

    // NMS (Non-Maximum Suppression)
    boundingBoxes = boundingBoxes.sort((bb1, bb2) => bb2.prob - bb1.prob)
    const result = []
    while (boundingBoxes.length > 0) {
      result.push(boundingBoxes[0])
      boundingBoxes = boundingBoxes.filter((bb) => iou(boundingBoxes[0], bb) < IOU_THRESHOLD)
    }

    return result
  })
