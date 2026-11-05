import * as tf from "@tensorflow/tfjs"
import { median, robustSigma } from "~/lib/array-stats"
import { findPlateau } from "~/lib/image"
import { hardCutWeight, robustPolyFit, splineCuadratic } from "~/lib/utils"
import type { Point } from "~/types/Point"

/** Separacion, en pixeles, entre centros consecutivos (y ancho de cada segmento). */
const CENTER_STEP = 8
/** Multiplicador de sigma robusta (MAD) a partir del cual un centro se descarta. */
const TRACE_MAD_K = 3
/**
 * Contraste minimo de un perfil (max-min), como fraccion de la mediana de
 * contrastes, para fiarse de su centro. Sin linea ni continuo no hay senal.
 */
const MIN_CONTRAST_RATIO = 0.25

/** Z-score al que se recortan los outliers de cada perfil (~95% en una normal). */
const OUTLIER_Z_THRESHOLD = 1.96
/** Umbral, sobre el perfil normalizado, que separa espectro de fondo. */
const PLATEAU_THRESHOLD = 0.5
/** Ventana de suavizado, como fraccion del alto del recorte. */
const SMOOTHING_WINDOW_RATIO = 0.15
/** Exponente de la super-gaussiana de bordes: mas alto = techo mas plano y caida mas brusca. */
const EDGE_WEIGHT_POWER = 4
/**
 * Peso minimo (en el borde exacto) de la super-gaussiana de bordes.
 * No puede valer 0: en `EDGE_WEIGHT_MIN ** normalized ** (2*power)` la base
 * en 0 da 0 en toda fila salvo la del centro geometrico exacto (que ademas
 * no existe si `height` es par), asi que colapsa casi todo el perfil a cero
 * antes de clampOutliers/binarizeProfiles. Ver #301.
 */
const EDGE_WEIGHT_MIN = 0.05

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
  /**
   * Separacion en pixeles entre centros consecutivos, que tambien es el ancho
   * de cada segmento analizado (segmentos contiguos).
   * @default 8
   */
  centerStep?: number
  /** Multiplicador de la apertura calculada. */
  percentAperture?: number
  /** Metodo de ajuste. Se ignora si se pasa baseTrace. */
  fitFunction?: FitFunction
  /** Traza ya calculada en otro espectro. Si se pasa, se reusa en vez de ajustar una nueva. */
  baseTrace?: TraceFunctions
  /**
   * Le resta peso a las filas cercanas al borde superior/inferior del recorte
   * al buscar el centro de cada checkpoint, para que una fuga puntual de un
   * espectro vecino no domine la deteccion. Solo afecta la busqueda del
   * centro; transversalAvgs siempre promedia los pixeles reales, sin pesar.
   * @default true
   */
  deemphasizeEdges?: boolean
}

/** Respuesta de extractSpectrum. */
export interface ExtractSpectrumResponse {
  /** Centros que siguen la traza (los descartados por outliers o sin señal no figuran). */
  mediasPoints: Point[]
  /** Apertura detectada (mediana de la de los centros que siguen la traza) */
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
 * @returns Tensor [xpoints.length, height].
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
      .squeeze([3]) // saca solo el canal: [xpoints.length, height, segmentWidth]
    return segments.mean(2) as tf.Tensor2D
  })
}

/**
 * Peso vertical tipo super-gaussiana: ~1 en el medio, techo casi plano, y
 * caida pronunciada solo cerca de los dos bordes (fila 0 y fila height-1).
 */
function edgeWeights(height: number): number[] {
  const center = (height - 1) / 2
  const halfWidth = center || 1
  return Array.from({ length: height }, (_, row) => {
    const normalized = (row - center) / halfWidth // -1..1
    return EDGE_WEIGHT_MIN ** (normalized ** (2 * EDGE_WEIGHT_POWER))
  })
}

/** Aplica edgeWeights a cada fila de los perfiles, para restarle peso a los bordes. */
function applyEdgeWeights(profiles: tf.Tensor2D, height: number): tf.Tensor2D {
  return tf.tidy(() => {
    const weights = tf.tensor2d(edgeWeights(height), [1, height])
    return profiles.mul(weights) as tf.Tensor2D
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
    // Un perfil plano (max == min) daria 0/0; con el piso queda todo bajo el umbral.
    const normalized = profiles.sub(min).div(max.sub(min).maximum(1e-6))

    const pushed = tf
      .onesLike(profiles)
      .where(normalized.greater(PLATEAU_THRESHOLD), tf.zerosLike(profiles))

    let window = Math.round(height * SMOOTHING_WINDOW_RATIO)
    if (window % 2 === 0) window += 1
    const kernel = tf.tensor3d(Array(window).fill(1 / window), [window, 1, 1])
    return pushed.expandDims(2).conv1d(kernel, 1, "same").squeeze([2]) as tf.Tensor2D
  })
}

/** Contraste (max - min) de cada perfil. */
function profileContrasts(profiles: tf.Tensor2D): number[] {
  const contrasts = tf.tidy(() => profiles.max(1).sub(profiles.min(1)))
  const values = contrasts.arraySync() as number[]
  contrasts.dispose()
  return values
}

/** Centro de un segmento y apertura del altiplano que lo ubica. */
interface Anchor extends Point {
  opening: number
}

/**
 * Centros contiguos de `step` px a lo largo de todo el ancho. Descarta el resto
 * final (< step) y garantiza al menos 2 centros para poder ajustar una recta.
 */
function buildCenters(width: number, centerStep: number): { xpoints: number[]; step: number } {
  const step = Math.max(1, Math.min(centerStep, Math.floor(width / 2)))
  const count = Math.floor(width / step)
  return { xpoints: Array.from({ length: count }, (_, i) => Math.round(i * step + step / 2)), step }
}

/**
 * Centro y apertura del altiplano de cada perfil binarizado. Se descartan los
 * perfiles sin senal (poco contraste o sin altiplano), que no ubican ningun
 * centro. Si casi todos quedan afuera se usan todos, para poder ajustar igual.
 */
function findTraceAnchors(
  binarized: tf.Tensor2D,
  contrasts: number[],
  xpoints: number[],
): Anchor[] {
  const profiles = binarized.arraySync() as number[][]
  const plateaus = profiles.map((profile) => findPlateau(profile, PLATEAU_THRESHOLD))
  const minContrast = median(contrasts) * MIN_CONTRAST_RATIO
  const all = xpoints.map((x, i) => ({ x, y: plateaus[i].medium, opening: plateaus[i].opening }))
  const withSignal = all.filter((_, i) => contrasts[i] >= minContrast && plateaus[i].opening > 0)
  return withSignal.length >= 2 ? withSignal : all
}

/**
 * Reusa la traza base desplazada, o ajusta una nueva sobre los centros hallados.
 * En ambos casos los centros que se alejan de la tendencia (defectos de la
 * placa, fugas del espectro vecino) se marcan como no validos.
 * @returns La traza y, por centro, si sigue esa traza.
 */
function buildTraceFunctions(
  anchors: Anchor[],
  fitFunction: FitFunction | undefined,
  baseTrace?: TraceFunctions,
): { trace: TraceFunctions; inliers: boolean[] } {
  if (baseTrace) {
    // Se ancla con la mediana del desplazamiento de todos los centros, no solo
    // el primero: si alguno queda contaminado no arrastra la traza entera.
    const offsets = anchors.map((p) => baseTrace.funct(p.x) - p.y)
    const offset = median(offsets)
    const sigma = robustSigma(offsets)
    const weight = hardCutWeight(TRACE_MAD_K)
    return {
      trace: { funct: (x) => baseTrace.funct(x) - offset, derived: baseTrace.derived },
      inliers: offsets.map((o) => sigma < 1e-9 || weight(Math.abs(o - offset) / sigma) > 0),
    }
  }
  const xs = anchors.map((p) => p.x)
  const ys = anchors.map((p) => p.y)
  const fit = robustPolyFit(xs, ys, { degree: 1, weight: hardCutWeight(TRACE_MAD_K) })
  if (fitFunction !== "spline") return { trace: fit, inliers: fit.inliers }
  return {
    trace: splineCuadratic(
      xs.filter((_, i) => fit.inliers[i]),
      ys.filter((_, i) => fit.inliers[i]),
    ),
    inliers: fit.inliers,
  }
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
  centerStep = CENTER_STEP,
  percentAperture = 1.0,
  fitFunction,
  baseTrace,
  deemphasizeEdges = true,
}: ExtractSpectrumProps): ExtractSpectrumResponse {
  const imgTensor = spectrum.toFloat()
  /** Coordenadas X de los centros, uno cada `segmentWidth` px a lo largo de toda la imagen. */
  const { xpoints, step: segmentWidth } = buildCenters(width, centerStep)

  const profiles = buildSegmentProfiles(imgTensor, xpoints, { width, height, segmentWidth })
  const weighted = deemphasizeEdges ? applyEdgeWeights(profiles, height) : profiles
  const clamped = clampOutliers(weighted)
  const binarized = binarizeProfiles(clamped, height)

  const anchors = findTraceAnchors(binarized, profileContrasts(clamped), xpoints)
  const { trace, inliers } = buildTraceFunctions(anchors, fitFunction, baseTrace)
  const valid = anchors.filter((_, i) => inliers[i])
  const mediasPoints = valid.map(({ x, y }) => ({ x, y }))
  const avgOpening = median(valid.map((a) => a.opening)) * percentAperture

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
  if (weighted !== profiles) weighted.dispose()
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
