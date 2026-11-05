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
      model: z.string().default("0.0.7.m.obb.observation.cont.onnx"),
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

    // Obtener imagen de la observación (mismo recorte que preview)
    const plateImage = await readEditedFile(observation.plate)
    const image = await sharp(plateImage)
      .extract({
        height: observation.imageHeight,
        top: observation.imageTop,
        left: observation.imageLeft,
        width: observation.imageWidth,
      })
      .toColorspace("srgb")
      .png()
      .toBuffer()

    // Pre-procesamiento: equivalente a prepare_input del frontend
    const originalMetadata = await sharp(image).metadata()
    const NATURALWIDTH = originalMetadata.width ?? 1
    const NATURALHEIGHT = originalMetadata.height ?? 1

    // Redimensionar a SIZE_M y obtener píxeles RGB
    const { data: rawPixels, info } = await sharp(image)
      .resize(SIZE_M, SIZE_M, { fit: "contain"  })
      .toColorspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { width, height, channels } = info
    const scale = Math.min(SIZE_M / NATURALWIDTH, SIZE_M / NATURALHEIGHT)
    const offsetX = (SIZE_M - NATURALWIDTH * scale) / 2
    const offsetY = (SIZE_M - NATURALHEIGHT * scale) / 2

    // Separar canales RGB y normalizar
    const red: number[] = new Array(SIZE_M * SIZE_M)
    const green: number[] = new Array(SIZE_M * SIZE_M)
    const blue: number[] = new Array(SIZE_M * SIZE_M)
    for (let i = 0; i < SIZE_M * SIZE_M; i++) {
      red[i] = rawPixels[i * channels] / 255
      green[i] = rawPixels[i * channels + 1] / 255
      blue[i] = rawPixels[i * channels + 2] / 255
    }

    const input = new Float32Array([...red, ...green, ...blue])

    // Inferencia
    const session = await InferenceSession.create(`./app/models/detect_observations/${data.model}`)
    const feeds = { images: new Tensor("float32", input, [1, 3, SIZE_M, SIZE_M]) }
    const outputs = await session.run(feeds)
    session.release()

    // Post-procesamiento
    const DATA = outputs.output0.data as Float32Array
    const DIMS = outputs.output0.dims

    let boundingBoxes: BoundingBox[] = []
    let id = 0
    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
    const obbToAabb = (w: number, h: number, angleRad: number) => {
      const cos = Math.cos(angleRad)
      const sin = Math.sin(angleRad)
      return {
        width: Math.abs(w * cos) + Math.abs(h * sin),
        height: Math.abs(w * sin) + Math.abs(h * cos),
      }
    }

    // Formato OBB: [1, N, 7] => [xc, yc, w, h, score, class, angle]
    const predictionCount = DIMS[1]
    for (let i = 0; i < predictionCount; i++) {
      const base = i * 7
      const xc = DATA[base]
      const yc = DATA[base + 1]
      const w = DATA[base + 2]
      const h = DATA[base + 3]
      const prob = DATA[base + 4]
      const class_id = Math.round(DATA[base + 5])
      const angle = DATA[base + 6]

      if (prob < CONFIDENCE_THRESHOLD) continue

      const centerX = (xc - offsetX) / scale
      const centerY = (yc - offsetY) / scale
      const obbW = w / scale
      const obbH = h / scale
      const aabb = obbToAabb(obbW, obbH, angle)

      let x1 = centerX - aabb.width / 2
      let y1 = centerY - aabb.height / 2
      let widthBB = aabb.width
      let heightBB = aabb.height

      if (forceMaxWidth) {
        x1 = 0
        widthBB = NATURALWIDTH
      }

      widthBB = clamp(widthBB, 1, NATURALWIDTH)
      heightBB = clamp(heightBB, 1, NATURALHEIGHT)
      x1 = clamp(x1, 0, Math.max(0, NATURALWIDTH - widthBB))
      y1 = clamp(y1, 0, Math.max(0, NATURALHEIGHT - heightBB))

      boundingBoxes.push({
        id: id++,
        name: "",
        x: x1,
        y: y1,
        width: widthBB,
        height: heightBB,
        class_info: (CLASSES[class_id] ?? CLASSES[0]) as BBClassesProps,
        prob,
      })
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
