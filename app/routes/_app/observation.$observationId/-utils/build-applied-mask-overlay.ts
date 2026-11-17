import type * as tf from "@tensorflow/tfjs"

interface CropGeometry {
  imageTop: number
  imageLeft: number
  imageWidth: number
  imageHeight: number
}

/** Mascara de un espectro ya extraido, con la posicion de su recorte en la observacion. */
export interface MaskSource {
  spectrum: CropGeometry
  mask: tf.Tensor4D
}

/** Pixeles del recorte que quedaron tapados: `data[fila * width + columna]` es 1 si lo estan. */
export interface MaskOverlay {
  data: Uint8Array
  width: number
  height: number
}

/**
 * Pasa las mascaras que se aplicaron antes de extraer un espectro (las de los
 * espectros extraidos primero) a las coordenadas de su recorte. Son las
 * regiones que la extraccion vio reemplazadas por fondo.
 * @returns `null` si ninguna mascara toca el recorte.
 */
export function buildAppliedMaskOverlay(
  target: CropGeometry,
  sources: MaskSource[],
): MaskOverlay | null {
  const width = Math.floor(target.imageWidth)
  const height = Math.floor(target.imageHeight)
  const targetTop = Math.floor(target.imageTop)
  const targetLeft = Math.floor(target.imageLeft)
  const data = new Uint8Array(width * height)
  let touched = false

  for (const { spectrum, mask } of sources) {
    if (mask.isDisposed) continue
    const maskHeight = mask.shape[1]
    const maskWidth = mask.shape[2]
    const values = mask.dataSync()
    const rowOffset = Math.floor(spectrum.imageTop) - targetTop
    const columnOffset = Math.floor(spectrum.imageLeft) - targetLeft
    for (let row = 0; row < maskHeight; row++) {
      const targetRow = row + rowOffset
      if (targetRow < 0 || targetRow >= height) continue
      for (let column = 0; column < maskWidth; column++) {
        if (!values[row * maskWidth + column]) continue
        const targetColumn = column + columnOffset
        if (targetColumn < 0 || targetColumn >= width) continue
        data[targetRow * width + targetColumn] = 1
        touched = true
      }
    }
  }

  return touched ? { data, width, height } : null
}
