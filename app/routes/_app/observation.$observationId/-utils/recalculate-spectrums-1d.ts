import * as tf from "@tensorflow/tfjs"
import { extractScience, type extractSpectrumResponse } from "~/lib/extract-features"
import { cropSpectrum } from "./crop-spectrum-from-observation"
import { maskingObservation } from "./mask-observation"

interface Spectrum {
  id: string
  imageTop: number
  imageLeft: number
  imageWidth: number
  imageHeight: number
}

/**
 * Recalcula la informacion de los espectros de ciencia 1D (si es necesario)
 * y actualiza variables de estado.
 * @returns {{id: string; intensityArr: number[];}[]}
 * - Arreglo 1D para cada espectro en caso de poder calcularlo.
 */
export function recalculateSpectrums1D(
  /** Tensor 2D (alto,ancho,gris) que representa la observacion a analizar */
  observationTensor: tf.Tensor2D,
  /** Listado de espectros a recalcular */
  spectrums: Spectrum[],
  /** Listado de datos de los espectros usados en la iteracion anterior */
  prevSpectrums: Spectrum[],
  /** Identificador del espectro principal */
  idPrincipalSpectrum: string,
  /** Cantidad puntos intermedios */
  countCheckpoints: number,
  /** Porcentaje de apertura */
  percentAperture: number,
  /** Analisis conocidos */
  prevAnalysis: { id: string; analysis: extractSpectrumResponse }[],
): { id: string; analysis: extractSpectrumResponse }[] {
  /** Si no hay espectros que recalcular no es necesario hacer nada */
  if (spectrums.length === 0) return []

  /** Imagen de observacion a Tensor4D Grey [1, H, W, 1] */
  let obsTensor = tf.tidy(() => {
    return observationTensor.expandDims(0).expandDims(-1)
  }) as tf.Tensor4D
  /** Tensor de zeros, persistir informacion de mascaras. */
  const zeros = tf.zerosLike(obsTensor)

  /** Arreglo con datos de los espectros que no necesitan ser recalculados */
  const persistentSpectrums = prevSpectrums.filter((s) => !spectrums.some((sr) => sr.id === s.id))
  /** Aplicar parches de todos los espectros que no haya que recalcular */
  for (const spect of persistentSpectrums) {
    const prevInfo = prevAnalysis.find((m) => m.id === spect.id)
    if (!prevInfo) continue
    const newObsTensor = maskingObservation(obsTensor, zeros, spect, prevInfo.analysis.spectrumMask)
    obsTensor.dispose()
    obsTensor = newObsTensor
  }

  /** Arreglo para guardar los analisis nuevos */
  const analysisArr: { id: string; analysis: extractSpectrumResponse }[] = []
  /** Para guardar la funcion de ajuste del espectro de ciencia */
  let spectrumRectFunction: (value: number) => number
  /** Para guardar la funcion de derivacion del espectro de ciencia */
  let spectrumDerivedFunction: (value: number) => number

  /** Si el espectro principal cambio procesar el nuevo principal */
  const specPrincipal = spectrums.find((s) => s.id === idPrincipalSpectrum)
  const specsLamps = spectrums.filter((s) => s.id !== idPrincipalSpectrum)
  if (specPrincipal) {
    /** Subimagen que corresponde al espectro science */
    const spectrumTensor = cropSpectrum(obsTensor, specPrincipal)
    /** Extraer caracteristicas */
    const useSpline = false
    const segmentWidth = 100
    const [_batch, height, width, _channels] = spectrumTensor.shape
    const result: extractSpectrumResponse = extractScience({
      science: spectrumTensor,
      width: width,
      height: height,
      countCheckpoints,
      percentAperture,
      segmentWidth: segmentWidth,
      fitFunction: useSpline ? "spline" : "linal-regression",
    })

    /** Liberar tensor de espectro */
    spectrumTensor.dispose()
    /** Aplicar mascara a tensor de observacion */
    const newObsTensor = maskingObservation(obsTensor, zeros, specPrincipal, result.spectrumMask)
    obsTensor.dispose()
    obsTensor = newObsTensor

    /** Actualizar datos para que los usen los que siguen */
    spectrumRectFunction = result.rectFunction
    spectrumDerivedFunction = result.derivedFunction
    analysisArr.push({ id: specPrincipal.id, analysis: result })
  } else {
    /** Si no cambio ciencia -> recuperar de funciones datos de cache */
    const principalInfo = prevAnalysis.find((s) => s.id === idPrincipalSpectrum)
    if (principalInfo) {
      spectrumRectFunction = principalInfo.analysis.rectFunction as (value: number) => number
      spectrumDerivedFunction = principalInfo.analysis.derivedFunction as (value: number) => number
    } else {
      /** Si no hay datos del espectro principal cacheados tira error */
      throw new Error("There is no data on the main spectrum")
    }
  }

  /** Procesar demas espectros del listado */
  for (const spectrum of specsLamps) {
    /** Subimagen que corresponde al espectro en forma de tensor */
    const spectrumTensor = cropSpectrum(obsTensor, spectrum)
    /** Extraer caracteristicas */
    const useSpline = false
    const segmentWidth = 100
    const [_batch, height, width, _channels] = spectrumTensor.shape
    const result: extractSpectrumResponse = extractScience({
      science: spectrumTensor,
      width: width,
      height: height,
      countCheckpoints,
      percentAperture,
      segmentWidth: segmentWidth,
      fitFunction: useSpline ? "spline" : "linal-regression",
      baseRectFunction: spectrumRectFunction,
      baseDerivedFunction: spectrumDerivedFunction,
    })
    /** Liberar tensor de espectro */
    spectrumTensor.dispose()
    /** Aplicar mascara a tensor de observacion */
    const newObsTensor = maskingObservation(obsTensor, zeros, spectrum, result.spectrumMask)
    obsTensor.dispose()
    obsTensor = newObsTensor

    /** Actualizar datos para que los usen los que siguen */
    analysisArr.push({ id: spectrum.id, analysis: result })
  }

  /** Liberar tensor creados para la operacion */
  obsTensor.dispose()
  zeros.dispose()

  /** Retorna el analisis de cada espectro que cambio */
  return analysisArr
}
