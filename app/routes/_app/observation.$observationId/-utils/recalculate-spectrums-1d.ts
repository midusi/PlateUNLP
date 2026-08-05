import * as tf from "@tensorflow/tfjs"
import {
  type ExtractSpectrumResponse,
  extractSpectrum,
  type FitFunction,
  type TraceFunctions,
} from "~/lib/extract-features"
import { cropSpectrum } from "./crop-spectrum-from-observation"
import { maskingObservation } from "./mask-observation"

/** Ancho de los segmentos verticales que se analizan en cada checkpoint. */
const SEGMENT_WIDTH = 100
const FIT_FUNCTION: FitFunction = "linal-regression"

interface Spectrum {
  id: string
  imageTop: number
  imageLeft: number
  imageWidth: number
  imageHeight: number
}

interface ExtractionSettings {
  countCheckpoints: number
  percentAperture: number
}

type Analysis = { id: string; analysis: ExtractSpectrumResponse }

/**
 * Extrae un espectro y lo tapa en el tensor de observacion, para que su señal
 * no interfiera con los espectros que se procesan despues.
 * @returns El analisis y el tensor de observacion ya parchado. El obsTensor
 * recibido queda liberado.
 */
function extractAndMask(
  obsTensor: tf.Tensor4D,
  bgTensor: tf.Tensor4D,
  spectrum: Spectrum,
  settings: ExtractionSettings,
  baseTrace?: TraceFunctions,
): { analysis: ExtractSpectrumResponse; obsTensor: tf.Tensor4D } {
  const spectrumTensor = cropSpectrum(obsTensor, spectrum)
  const [, height, width] = spectrumTensor.shape

  const analysis = extractSpectrum({
    spectrum: spectrumTensor,
    width,
    height,
    segmentWidth: SEGMENT_WIDTH,
    fitFunction: FIT_FUNCTION,
    countCheckpoints: settings.countCheckpoints,
    percentAperture: settings.percentAperture,
    baseTrace,
  })
  spectrumTensor.dispose()

  const masked = maskingObservation(obsTensor, bgTensor, spectrum, analysis.spectrumMask)
  obsTensor.dispose()
  return { analysis, obsTensor: masked }
}

/**
 * Recalcula la informacion de los espectros de ciencia 1D (si es necesario)
 * y actualiza variables de estado.
 * @returns Analisis de cada espectro que haya cambiado.
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
  prevAnalysis: Analysis[],
): Analysis[] {
  if (spectrums.length === 0) return []

  const settings: ExtractionSettings = { countCheckpoints, percentAperture }

  /** Imagen de observacion a Tensor4D Grey [1, H, W, 1] */
  let obsTensor = tf.tidy(() => observationTensor.expandDims(0).expandDims(-1)) as tf.Tensor4D
  /** Tensor de zeros, persistir informacion de mascaras. */
  const zeros = tf.zerosLike(obsTensor)

  /** Tapar los espectros que no hay que recalcular, reusando su mascara previa. */
  const persistentSpectrums = prevSpectrums.filter((s) => !spectrums.some((sr) => sr.id === s.id))
  for (const spect of persistentSpectrums) {
    const prevInfo = prevAnalysis.find((m) => m.id === spect.id)
    if (!prevInfo) continue
    const newObsTensor = maskingObservation(obsTensor, zeros, spect, prevInfo.analysis.spectrumMask)
    obsTensor.dispose()
    obsTensor = newObsTensor
  }

  const analysisArr: Analysis[] = []
  /** Traza del espectro principal: las lamparas la reusan como base. */
  let principalTrace: TraceFunctions

  const specPrincipal = spectrums.find((s) => s.id === idPrincipalSpectrum)
  const specsLamps = spectrums.filter((s) => s.id !== idPrincipalSpectrum)

  if (specPrincipal) {
    const result = extractAndMask(obsTensor, zeros, specPrincipal, settings)
    obsTensor = result.obsTensor
    principalTrace = {
      funct: result.analysis.rectFunction,
      derived: result.analysis.derivedFunction,
    }
    analysisArr.push({ id: specPrincipal.id, analysis: result.analysis })
  } else {
    /** No cambio el principal: se recupera su traza del cache. */
    const principalInfo = prevAnalysis.find((s) => s.id === idPrincipalSpectrum)
    if (!principalInfo) throw new Error("There is no data on the main spectrum")
    principalTrace = {
      funct: principalInfo.analysis.rectFunction,
      derived: principalInfo.analysis.derivedFunction,
    }
  }

  for (const spectrum of specsLamps) {
    const result = extractAndMask(obsTensor, zeros, spectrum, settings, principalTrace)
    obsTensor = result.obsTensor
    analysisArr.push({ id: spectrum.id, analysis: result.analysis })
  }

  obsTensor.dispose()
  zeros.dispose()

  return analysisArr
}
