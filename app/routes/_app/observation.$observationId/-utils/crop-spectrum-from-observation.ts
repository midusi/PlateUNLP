import * as tf from "@tensorflow/tfjs"
import { buildGeometryMask } from "~/lib/oriented-box"

/**
 * Recibe la imagen de una observacion, la especificacion de un
 * espectro y devuelve la porcion de la observacion que corresponde
 * al espectro.
 *
 * El recorte es el rectangulo envolvente de la caja del espectro. Si la caja esta
 * inclinada (`imageAngle`), todo lo que cae fuera de ella, las esquinas del
 * rectangulo, se pone en negro: es una mascara mas, igual a las que dejan los
 * espectros ya procesados (`maskingObservation`).
 * @param obsTensor - Tensor de observacion
 * @param spectrum - Especificacion del espectro
 * @returns {tf.Tensor4D} - Tensor de espectro
 */
export function cropSpectrum(
  obsTensor: tf.Tensor4D,
  spectrum: {
    imageTop: number
    imageLeft: number
    imageWidth: number
    imageHeight: number
    imageAngle?: number | null
  },
): tf.Tensor4D {
  const top = Math.floor(spectrum.imageTop)
  const left = Math.floor(spectrum.imageLeft)
  const height = Math.floor(spectrum.imageHeight)
  const width = Math.floor(spectrum.imageWidth)
  const crop = tf.slice(obsTensor, [0, top, left, 0], [1, height, width, obsTensor.shape[3]])
  const boxMask = buildGeometryMask({ ...spectrum, imageWidth: width, imageHeight: height })
  if (!boxMask) return crop
  return tf.tidy(() => {
    const inside = tf.tensor4d(boxMask, [1, height, width, 1], "bool")
    const masked = tf.where(inside, crop, tf.zerosLike(crop)) as tf.Tensor4D
    crop.dispose()
    return masked
  })
}
