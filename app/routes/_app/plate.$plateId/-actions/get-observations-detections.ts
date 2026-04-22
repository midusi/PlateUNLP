import { createServerFn } from "@tanstack/react-start"
import { InferenceSession, Tensor } from "onnxruntime-node"
//import * as tf from "@tensorflow/tfjs-node"
import path from "path"
import sharp from "sharp"
import { z } from "zod"
import { db } from "~/db"
import { readUploadedFile } from "~/lib/uploads"

export const getObservationDetections = createServerFn()
  .inputValidator(
    z.object({
      plateId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    /** Imagen de la placa */
    const plate = await db.query.plate.findFirst({
      where: (t, { eq }) => eq(t.id, data.plateId),
      with: { image: true },
    })
    if (!plate) return new Response("Plate not found", { status: 404 })
    // Always convert to sRGB and PNG format for consistency
    //image = await sharp(image).rotate(plate.imageRotation).toColorspace("srgb").png().toBuffer()
    const image = await readUploadedFile(plate.image.id)
    const { data: data_img, info } = await sharp(image)
      .rotate(plate.imageRotation)
      .resize(640, 640, { fit: "contain", background: { r: 0, g: 0, b: 0 } })
      .toColorspace("srgb")
      .removeAlpha()
      .png()
      .toBuffer({ resolveWithObject: true })

    // Convertir HWC → CHW
    const width = info.width
    const height = info.height
    const channels = info.channels // debería ser 3
    const floatData = new Float32Array(1 * channels * width * height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels

        const r = data_img[idx] / 255
        const g = data_img[idx + 1] / 255
        const b = data_img[idx + 2] / 255

        const pixelIndex = y * width + x

        floatData[pixelIndex] = r
        floatData[pixelIndex + width * height] = g
        floatData[pixelIndex + 2 * width * height] = b
      }
    }

    // input (ejemplo)
    const input = new Tensor("float32", floatData, [1, 3, height, width])

    const session = await InferenceSession.create(
      `C:\\Repositorios\\PlateUNLP\\app\\models\\detect_observations\\best.onnx`,
    )

    // inferencia
    const feeds = { images: input } // nombre depende del modelo
    const results = await session.run(feeds)

    console.log(session.inputNames)
    console.log(results)
    /** Guardar imagen */
    // const outputPath = path.join(process.cwd(), "tmp", `plate-${data.plateId}.png`)
    // await fs.mkdir(path.dirname(outputPath), { recursive: true })
    // await fs.writeFile(outputPath, data_img)
    // console.log("Image saved at:", outputPath)
    return 1

    /** Obtener ancho de la imagen */
    // const img = new Image()
    // img.src = `/plate/${data.plateId}/preview`
    // img.onload = async () => {
    //     // //const boundingBoxes = predictions;
    //     // /** Actualizar base de datos */
    //     // const science = {
    //     //     imageTop: Math.round(boundingBoxes[0].y), //.top
    //     //     imageLeft: 0, // Forzar ancho maximo
    //     //     imageWidth: img.naturalWidth, // Forzar ancho maximo
    //     //     imageHeight: Math.round(boundingBoxes[0].height),
    //     // }
    //     // const lamp1 = {
    //     //     imageTop: Math.round(boundingBoxes[1].y), //.top
    //     //     imageLeft: 0, // Forzar ancho maximo
    //     //     imageWidth: img.naturalWidth, // Forzar ancho maximo
    //     //     imageHeight: Math.round(boundingBoxes[1].height),
    //     // }
    //     // const lamp2 = {
    //     //     imageTop: Math.round(boundingBoxes[2].y), //.top
    //     //     imageLeft: 0, // Forzar ancho maximo
    //     //     imageWidth: img.naturalWidth, // Forzar ancho maximo
    //     //     imageHeight: Math.round(boundingBoxes[2].height),
    //     // }
    //     // const newSpectrums = await addSpectrums({
    //     //     data: { observationId, science, lamp1, lamp2 },
    //     // })
    //     // router.invalidate()
    //     // const boundingBoxesFormated = [
    //     //     spectrumToBoundingBox(newSpectrums.science),
    //     //     spectrumToBoundingBox(newSpectrums.lamp1),
    //     //     spectrumToBoundingBox(newSpectrums.lamp2),
    //     // ]
    //     // setBoundingBoxes((prev) => [...boundingBoxesFormated, ...prev])
    // }

    // return 1
  })
