import * as tf from "@tensorflow/tfjs"
import { findPlateau, findXspacedPoints } from "~/lib/image"
import { linearRegressionWhitDerived, splineCuadratic } from "~/lib/utils"
import type { Point } from "~/types/Point"

/** Z-score al que se recortan los outliers de cada perfil (~95% en una normal). */
const OUTLIER_Z_THRESHOLD = 1.96
/** Umbral, sobre el perfil normalizado, que separa espectro de fondo. */
const PLATEAU_THRESHOLD = 0.5
/** Ventana de suavizado, como fraccion del alto del recorte. */
const SMOOTHING_WINDOW_RATIO = 0.15

/** Metodo de ajuste para la traza media. */
export type FitFunction = "linal-regression" | "spline"

/** Traza media del espectro y su derivada, en pixeles. */
export interface TraceFunctions {
  funct: (value: number) => number
  derived: (value: number) => number
}

/** Parametros recibidos por extractSpectrum. */
export interface ExtractSpectrumProps {
  /** Tensor de pixeles 4D Grey [1, height, width, 1]. */
  spectrum: tf.Tensor4D
  /** Ancho del recorte. */
  width: number
  /** Alto del recorte. */
  height: number
  /** Cantidad de puntos intermedios a usar. */
  countCheckpoints: number
  /** Ancho a considerar para el analisis de segmentos. */
  segmentWidth: number
  /** Multiplicador de la apertura calculada. */
  percentAperture?: number
  /** Metodo de ajuste. Se ignora si se pasa baseTrace. */
  fitFunction?: FitFunction
  /** Traza ya calculada en otro espectro. Si se pasa, se reusa en vez de ajustar una nueva. */
  baseTrace?: TraceFunctions
}

/** Respuesta de extractSpectrum. */
export interface ExtractSpectrumResponse {
  /** Puntos medios elegidos para la extracción */
  mediasPoints: Point[]
  /** Apertura promedio detectada */
  opening: number
  /** Funcion de la recta media del espectro medida en pixels */
  rectFunction: (value: number) => number
  /** Funcion de derivadas a travez de rectFunction */
  derivedFunction: (value: number) => number
  /**
   * Promedio por columna (vertical respecto a la imagen) de los pixels pasan
   * por rectFunction dentro de la apertura.
   */
  transversalAvgs: number[]
  /**
   * Mascara booleana que indica la region de la imagen donde se encuentra el
   * espectro de ciencia [1, imageH, imageW, 1].
   */
  spectrumMask: tf.Tensor4D
}

/**
 * Recorta un segmento vertical centrado en cada checkpoint y lo promedia
 * horizontalmente, dejando un perfil por checkpoint.
 * @returns Tensor [countCheckpoints, height].
 */
function buildSegmentProfiles(
  imgTensor: tf.Tensor4D,
  xpoints: number[],
  { width, height, segmentWidth }: { width: number; height: number; segmentWidth: number },
): tf.Tensor2D {
  return tf.tidy(() => {
    const boxIdx = tf.tensor1d(new Array(xpoints.length).fill(0), "int32")
    const boxes = tf.tensor2d(
      xpoints.map((x) => {
        const start = Math.max(0, x - Math.floor(segmentWidth / 2))
        const end = Math.min(width, x + Math.ceil(segmentWidth / 2))
        return [0, start / width, 1, end / width]
      }),
      [xpoints.length, 4],
      "float32",
    )
    const segments = tf.image
      .cropAndResize(imgTensor, boxes, boxIdx, [height, segmentWidth], "nearest")
      .squeeze() // saca el canal: [countCheckpoints, height, segmentWidth]
    return segments.mean(2) as tf.Tensor2D
  })
}

/** Recorta los outliers de cada perfil, por arriba y por abajo, al limite de ±z·σ. */
function clampOutliers(profiles: tf.Tensor2D): tf.Tensor2D {
  return tf.tidy(() => {
    const mean = profiles.mean(1, true)
    const std = profiles.sub(mean).square().mean(1, true).sqrt()
    const lowerLimit = mean.sub(std.mul(OUTLIER_Z_THRESHOLD))
    const upperLimit = mean.add(std.mul(OUTLIER_Z_THRESHOLD))
    const clampedLower = profiles.where(profiles.greater(lowerLimit), lowerLimit)
    return clampedLower.where(clampedLower.less(upperLimit), upperLimit) as tf.Tensor2D
  })
}

/**
 * Normaliza cada perfil, lo lleva a 0/1 segun el umbral y lo suaviza para
 * borrar baches chicos.
 */
function binarizeProfiles(profiles: tf.Tensor2D, height: number): tf.Tensor2D {
  return tf.tidy(() => {
    const min = profiles.min(1, true)
    const max = profiles.max(1, true)
    const normalized = profiles.sub(min).div(max.sub(min))

    const pushed = tf
      .onesLike(profiles)
      .where(normalized.greater(PLATEAU_THRESHOLD), tf.zerosLike(profiles))

    let window = Math.round(height * SMOOTHING_WINDOW_RATIO)
    if (window % 2 === 0) window += 1
    const kernel = tf.tensor3d(Array(window).fill(1 / window), [window, 1, 1])
    return pushed.expandDims(2).conv1d(kernel, 1, "same").squeeze() as tf.Tensor2D
  })
}

/** Centro y apertura del altiplano de cada perfil binarizado. */
function findTraceAnchors(
  binarized: tf.Tensor2D,
  xpoints: number[],
): { mediasPoints: Point[]; opening: number } {
  const profiles = binarized.arraySync() as number[][]
  const plateaus = profiles.map((profile) => findPlateau(profile, PLATEAU_THRESHOLD))
  return {
    mediasPoints: xpoints.map((x, i) => ({ x, y: plateaus[i].medium })),
    opening: plateaus.reduce((sum, p) => sum + p.opening, 0) / plateaus.length,
  }
}

/** Reusa la traza base desplazada, o ajusta una nueva sobre los centros hallados. */
function buildTraceFunctions(
  mediasPoints: Point[],
  fitFunction: FitFunction | undefined,
  baseTrace?: TraceFunctions,
): TraceFunctions {
  if (baseTrace) {
    // Se ancla al primer centro y se desplaza verticalmente.
    const offset = baseTrace.funct(mediasPoints[0].x) - mediasPoints[0].y
    return { funct: (x) => baseTrace.funct(x) - offset, derived: baseTrace.derived }
  }
  const xs = mediasPoints.map((p) => p.x)
  const ys = mediasPoints.map((p) => p.y)
  return fitFunction === "spline" ? splineCuadratic(xs, ys) : linearRegressionWhitDerived(xs, ys)
}

/** Mascara booleana [height, width] de la banda de apertura alrededor de la traza. */
function buildApertureMask(
  trace: TraceFunctions,
  { width, height, opening }: { width: number; height: number; opening: number },
): tf.Tensor2D {
  return tf.tidy(() => {
    const xValues = tf.range(0, width, 1, "int32").arraySync() as number[]
    const centers = tf.tensor1d(xValues.map((x) => trace.funct(x)))
    const minYs = centers.sub(opening / 2)
    const maxYs = centers.add(opening / 2)
    /** Coordenada vertical de cada pixel: [height, width]. */
    const rowMatrix = tf.tile(tf.range(0, height, 1, "int32").expandDims(1), [1, width])
    return tf.logicalAnd(rowMatrix.greater(minYs), rowMatrix.less(maxYs)) as tf.Tensor2D
  })
}

/** Promedia, columna por columna, los pixeles que caen dentro de la apertura. */
function averageAcrossAperture(
  gray2d: tf.Tensor2D,
  mask: tf.Tensor2D,
  slopeAtOrigin: number,
  { width, height }: { width: number; height: number },
): tf.Tensor1D {
  return tf.tidy(() => {
    const masked = tf.where(mask, gray2d, tf.fill([height, width], 0))
    /** Se rota para dejar la traza horizontal antes de promediar. */
    const rad = Math.atan(slopeAtOrigin)
    const rotate = (t: tf.Tensor2D) =>
      tf.image.rotateWithOffset(t.expandDims(0).expandDims(-1) as tf.Tensor4D, rad, 0, [0.5, 0.5])

    const maskedRotated = rotate(masked).squeeze([0, 3])
    const maskRotated = rotate(mask.toFloat()).toInt().squeeze([0, 3])

    const validPerColumn = maskRotated.cast("int32").sum(0)
    return maskedRotated.sum(0).div(validPerColumn) as tf.Tensor1D
  })
}

/**
 * Extrae las caracteristicas de un espectro: la traza media, su apertura y la
 * señal 1D que resulta de promediar dentro de esa apertura.
 */
export function extractSpectrum({
  spectrum,
  width,
  height,
  countCheckpoints,
  segmentWidth,
  percentAperture = 1.0,
  fitFunction,
  baseTrace,
}: ExtractSpectrumProps): ExtractSpectrumResponse {
  const imgTensor = spectrum.toFloat()
  /** Coordenadas X de los checkpoints repartidos a lo largo de la imagen. */
  const xpoints = findXspacedPoints(width, countCheckpoints)

  const profiles = buildSegmentProfiles(imgTensor, xpoints, { width, height, segmentWidth })
  const clamped = clampOutliers(profiles)
  const binarized = binarizeProfiles(clamped, height)

  const { mediasPoints, opening } = findTraceAnchors(binarized, xpoints)
  const avgOpening = opening * percentAperture
  const trace = buildTraceFunctions(mediasPoints, fitFunction, baseTrace)

  const gray2d = imgTensor.squeeze([0, 3]) as tf.Tensor2D
  const apertureMask = buildApertureMask(trace, { width, height, opening: avgOpening })
  const transversalAvgs = averageAcrossAperture(gray2d, apertureMask, trace.derived(0), {
    width,
    height,
  })
  // Un solo reshape en vez de dos expandDims encadenados: el resultado
  // intermedio de expandDims(0) quedaba sin ninguna referencia para liberarlo.
  const spectrumMask = apertureMask.reshape([1, height, width, 1]) as tf.Tensor4D
  const transversalAvgsArr = transversalAvgs.arraySync() as number[]

  imgTensor.dispose()
  profiles.dispose()
  clamped.dispose()
  binarized.dispose()
  gray2d.dispose()
  apertureMask.dispose()
  transversalAvgs.dispose()

  return {
    mediasPoints,
    opening: avgOpening,
    rectFunction: trace.funct,
    derivedFunction: trace.derived,
    transversalAvgs: transversalAvgsArr,
    spectrumMask,
  }
}
