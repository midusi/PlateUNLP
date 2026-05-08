import { createServerFn } from "@tanstack/react-start"
import { nanoid } from "nanoid"
import { InferenceSession, Tensor } from "onnxruntime-node"
import sharp from "sharp"
import { z } from "zod"
import { db } from "~/db"
import { readUploadedFile } from "~/lib/uploads"

/**
 * Función para obtener las detecciones de observaciones en una placa utilizando un modelo ONNX.
 * El proceso retorna un arreglo de detecciones valida, cada una con sus respectivas coordenadas
 * y score.
 */
export const getObservationDetections = createServerFn()
  .inputValidator(
    z.object({
      plateId: z.string(),
      umbral: z.number().optional().default(0.5),
    }),
  )
  .handler(async ({ data }) => {
    /** Imagen de la placa */
    const plate = await db.query.plate.findFirst({
      where: (t, { eq }) => eq(t.id, data.plateId),
      with: { image: true },
    })
    if (!plate) return new Response("Plate not found", { status: 404 })
    //image = await sharp(image).rotate(plate.imageRotation).toColorspace("srgb").png().toBuffer()
    /** Obtener imagen */
    const image = await readUploadedFile(plate.image.id)
    // 0. Obtener dimensiones originales
    const originalMetadata = await sharp(image).metadata()
    const origW = originalMetadata.width ?? 1
    const origH = originalMetadata.height ?? 1
    // 1. Obtener los píxeles CRUDOS (sin comprimir a PNG)
    const { data: rawPixels, info } = await sharp(image)
      .rotate(plate.imageRotation)
      .resize(640, 640, { fit: "contain", background: { r: 0, g: 0, b: 0 } })
      .toColorspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const { width, height, channels } = info

    // 3. Calcular el factor de escala y el desplazamiento (offset) por el padding
    const scale = Math.min(640 / origW, 640 / origH)
    const offsetX = (640 - origW * scale) / 2
    const offsetY = (640 - origH * scale) / 2

    // // Guardar para debug (usando el buffer RAW)
    // await sharp(rawPixels, { raw: { width, height, channels } }).toFile(
    //   path.join(process.cwd(), "debug_input.png"),
    // )

    // 3. Convertir a float32 y normalizar
    const floatData = new Float32Array(1 * channels * width * height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels
        const pixelIndex = y * width + x

        floatData[pixelIndex] = rawPixels[idx] / 255
        floatData[pixelIndex + width * height] = rawPixels[idx + 1] / 255
        floatData[pixelIndex + 2 * width * height] = rawPixels[idx + 2] / 255
      }
    }

    // input (ejemplo)
    const input = new Tensor("float32", floatData, [1, 3, height, width])

    const session = await InferenceSession.create(
      `./app/models/detect_observations/detect_observations.3.0.0.m.onnx`,
    )

    // inferencia
    const feeds = { images: input } // nombre depende del modelo
    const results = await session.run(feeds)

    // Procesar resultados (ejemplo)
    const output = results["output0"] // dims: [1,300,6]
    const rawBoxes = output.data as Float32Array
    const elementsPerPrediction = 6
    const scoreIndex = 4 // score en posicion 4 de cada prediccion
    const validPredictions = []
    for (let i = 0; i < rawBoxes.length; i += elementsPerPrediction) {
      const score = rawBoxes[i + scoreIndex]
      if (score >= data.umbral && !Number.isNaN(score)) {
        const detection = Array.from(rawBoxes.slice(i, i + elementsPerPrediction))
        validPredictions.push(detection)
      }
    }

    const formattedPredictions = validPredictions.map((pred, idx) => {
      // x1, y1, x2, y2 vienen en el espacio de 640x640
      const [x1, y1, x2, y2, _score, _class] = pred

      // Mapear de vuelta al espacio original:
      // 1. Restar el padding (offset)
      // 2. Dividir por la escala aplicada
      const realX1 = (x1 - offsetX) / scale
      const realY1 = (y1 - offsetY) / scale
      const realX2 = (x2 - offsetX) / scale
      const realY2 = (y2 - offsetY) / scale

      return {
        id: nanoid(), // Mejor usar nanoid aquí para evitar conflictos de keys
        name: `Observation ${nanoid(4)}`,
        imageWidth: realX2 - realX1,
        imageHeight: realY2 - realY1,
        imageLeft: realX1,
        imageTop: realY1,
      }
    })

    return formattedPredictions
  })
