import { createServerFn } from "@tanstack/react-start"
import { nanoid } from "nanoid"
import { InferenceSession, Tensor } from "onnxruntime-node"
import sharp from "sharp"
import { z } from "zod"
import { db } from "~/db"
import { obsNFromIndex } from "~/lib/obs-n"
import { readEditedFile } from "~/lib/uploads"

/**
 * Función para obtener las detecciones de observaciones en una placa utilizando un modelo ONNX.
 * El proceso retorna un arreglo de detecciones valida, cada una con sus respectivas coordenadas
 * y score.
 */
export const getObservationDetections = createServerFn()
  .validator(
    z.object({
      plateId: z.string(),
      umbral: z.number().optional().default(0.1),
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
    // const image = await readUploadedFile(plate.image.id)
    const image = await readEditedFile(plate)

    // 0. Obtener dimensiones originales
    const originalMetadata = await sharp(image).metadata()
    const origW = originalMetadata.width ?? 1
    const origH = originalMetadata.height ?? 1
    // 1. Obtener los píxeles CRUDOS (sin comprimir a PNG)
    const { data: rawPixels, info } = await sharp(image)
      .resize(640, 640, { fit: "contain", background: { r: 0, g: 0, b: 0 } })
      .toColorspace("srgb")
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const { width, height, channels } = info

    // imprimir imagen para debug
    await sharp(image)
      .resize(640, 640, { fit: "fill", background: { r: 0, g: 0, b: 0 } })
      .toColorspace("srgb")
      .removeAlpha()
      .png()
      .toFile(`./plate_${data.plateId}_4.png`)

    // 2. Calcular el factor de escala y el desplazamiento (offset) por el padding
    const scale = Math.min(640 / origW, 640 / origH)
    const offsetX = (640 - origW * scale) / 2
    const offsetY = (640 - origH * scale) / 2

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
      `./app/models/detect_observations/0.0.7.m.obb.observation.cont.onnx`,
    )

    // inferencia
    const feeds = { images: input } // nombre depende del modelo
    const results = await session.run(feeds)
    
    // console.log("Raw inference results:", results)
    // Procesar resultados (ejemplo)
    const output = results.output0 // dims: [1,300,7]
    // console.log("Output tensor:", output.data)
    const rawBoxes = output.data as Float32Array
    const elementsPerPrediction = 7
    const scoreIndex = 4 // score en posicion 4 de cada prediccion
    const validPredictions = []
    for (let i = 0; i < rawBoxes.length; i += elementsPerPrediction) {
      const score = rawBoxes[i + scoreIndex]

      if (score >= data.umbral && !Number.isNaN(score)) {
        const detection = Array.from(rawBoxes.slice(i, i + elementsPerPrediction))
        validPredictions.push(detection)
      }
    }

    // console.log("Valid predictions after filtering:", validPredictions)

    const clamp = (v: number, min: number, max: number) =>
      Math.min(Math.max(v, min), max)
    const obbToAabb = (w: number, h: number, angleRad: number) => {
      const cos = Math.cos(angleRad)
      const sin = Math.sin(angleRad)
      return {
        width: Math.abs(w * cos) + Math.abs(h * sin),
        height: Math.abs(w * sin) + Math.abs(h * cos),
      }
    }

    const formattedPredictions = validPredictions
      .map((pred) => {
        // x1, y1 coordendas del centro
        // w es ancho
        // h es alto
        // score es la confianza
        // class es la clase predicha (0 = observación)
        // inc es la inclinación de la caja
        const [x1, y1, w, h, _score, _class, inc] = pred

        // Mapear de vuelta al espacio original:
        // 1. Restar el padding (offset)
        // 2. Dividir por la escala aplicada
        // 3. Recortar a los bordes: el modelo puede predecir cajas que se salen
        //    unos píxeles de la imagen (p. ej. left = -0.88 en una placa rotada)

        const centerX = (x1 - offsetX) / scale
        const centerY = (y1 - offsetY) / scale
        const obbW = w / scale
        const obbH = h / scale
        const aabb = obbToAabb(obbW, obbH, inc)

        const imageWidth = clamp(aabb.width, 0, origW)
        const imageHeight = clamp(aabb.height, 0, origH)
        const imageLeft = clamp(centerX - imageWidth / 2, 0, Math.max(0, origW - imageWidth))
        const imageTop = clamp(centerY - imageHeight / 2, 0, Math.max(0, origH - imageHeight))

        return {
          imageWidth,
          imageHeight,
          imageLeft,
          imageTop,
        }
      })
      // Descartar cajas que tras el recorte quedan sin área (predichas fuera de la imagen)
      .filter((box) => box.imageWidth >= 1 && box.imageHeight >= 1)
      .map((box, idx) => ({
        id: nanoid(),
        name: `Obs. ${obsNFromIndex(idx)}`,
        ...box,
      }))

    return formattedPredictions
  })
