import { createServerFn } from "@tanstack/react-start"
import * as tf from "@tensorflow/tfjs-node"
import { info } from "console"
import fs from "fs/promises"
import path from "path"
import sharp from "sharp"
import { z } from "zod"
import { db } from "~/db"
import { readUploadedFile } from "~/lib/uploads"

// const determineBBFunction = usePredictBBs(
//     1088,
//     "spectrum_part_segmentator.onnx",
//     classesSpectrumDetection,
//     false,
//     0.7,
//   )

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

    /** Guardar imagen */
    // const outputPath = path.join(process.cwd(), "tmp", `plate-${data.plateId}.png`)
    // await fs.mkdir(path.dirname(outputPath), { recursive: true })
    // await fs.writeFile(outputPath, data_img)
    // console.log("Image saved at:", outputPath)

    /** Cargar modelo */
    const modelPath = path.resolve("app/models/detect_observations/tfjs_model/model.json")
    const model = await tf.loadGraphModel(`file://${modelPath}`)
    //console.log("Modelo cargado:", model)

    const result = tf.tidy(() => {
      /** Preparar Input **/
      const image_t = tf.node.decodeImage(data_img, 3).expandDims(0).toFloat()

      /** Predecir */
      const predictions = model.predict(image_t)
      //const image_t = tf.tensor3d(data_img, [info.height, info.width, info.channels])

      const minTensor = image_t.min()
      const maxTensor = image_t.max()

      // const min = minTensor.arraySync() as number
      // const max = maxTensor.arraySync() as number

      return {
        shape: image_t.shape,
        min,
        max,
        predictions_arr_0: predictions[0].shape,
        predictions_arr_1: predictions[1].shape,
      }
    })

    console.log(result)
    return 1

    /** Obtener ancho de la imagen */
    const img = new Image()
    img.src = `/plate/${data.plateId}/preview`
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

function decode(predictions: tf.Tensor | tf.Tensor[], imageWidth: number, imageHeight: number) {}
