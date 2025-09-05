import type * as tf from "@tensorflow/tfjs"

/**
 * Dada un tensor de observacion parchea las regiones
 * correspondientes a una observacion.
 * @param obsTensor - Tensor de observacion.
 * @param bgTensor - Matriz de mismas dimensiones que obsTensor con
 * especificacion de con que rellenar los espacios borrados.
 * @param spectrumData - Datos de espectro.
 * @param spectrumMask - Mascara del espectro.
 * @returns {tf.Tensor4D} - Observacion parcheada
 */
export function maskingObservation(
  obsTensor: tf.Tensor4D,
  bgTensor: tf.Tensor4D,
  spectrumData: {
    imageTop: number
    imageLeft: number
    imageWidth: number
    imageHeight: number
  },
  spectrumMask: tf.Tensor4D,
): tf.Tensor4D {
  /** Expandir mascara a dimension de observación */
  const obsHeight = obsTensor.shape[1]
  const obsWidth = obsTensor.shape[2]
  const { imageTop, imageLeft, imageHeight, imageWidth } = spectrumData
  const top = Math.floor(imageTop)
  const left = Math.floor(imageLeft)
  const bottom = obsHeight - top - Math.floor(imageHeight)
  const right = obsWidth - left - Math.floor(imageWidth)
  const padArrays: Array<[number, number]> = [
    [0, 0], // batch agregados
    [top, bottom], // filas agregadas
    [left, right], // columnas agregadas
    [0, 0], // canales agregados
  ]
  const maskPadded = spectrumMask.pad(padArrays)
  /** Aplicar mascara */
  return bgTensor.where(maskPadded, obsTensor)
}
