import * as tf from "@tensorflow/tfjs"

/**
 * Recibe la imagen de una observacion, la especificacion de un
 * espectro y devuelve la porcion de la observacion que corresponde
 * al espectro.
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
  },
): tf.Tensor4D {
  const top = Math.floor(spectrum.imageTop)
  const left = Math.floor(spectrum.imageLeft)
  const height = Math.floor(spectrum.imageHeight)
  const width = Math.floor(spectrum.imageWidth)
  return tf.slice(obsTensor, [0, top, left, 0], [1, height, width, obsTensor.shape[3]])
}
