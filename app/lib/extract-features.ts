import * as tf from "@tensorflow/tfjs"
import { Axis } from "@visx/axis"
import { AArrowDown } from "lucide-react"
import { max, mean, min, round } from "mathjs"
import {
  findPlateau,
  findXspacedPoints,
  getPointsInRect,
  obtainImageSegments,
  promediadoHorizontal,
} from "~/lib/image"
import { extremePoints } from "~/lib/trigonometry"
import {
  downloadGrayscaleImage,
  guardarFuncion,
  guardarRectaYPuntos,
  linearRegressionWhitDerived,
  meanSmooth,
  pushToExtremes,
  pushToExtremeTf,
  splineCuadratic,
  weightedSmooth,
} from "~/lib/utils"
import type { Point } from "~/types/Point"

/**
 * Parametros recibidos por extractScience
 * @interface extractScience
 */
export interface extractScienceProps {
  /** Matriz de pixeles */
  science: Uint8Array
  /** Ancho de ciencia */
  width: number
  /** Alto de ciencia */
  height: number
  /** Cantidad de puntos intermedios a usar */
  countCheckpoints: number
  /** Ancho a considerar para el analisis de segmentos */
  segmentWidth: number
  /** Funcion de ajuste a usar */
  fitFunction?: "linal-regression" | "spline"
}

/** Respuesta de metodo extractScience */
export interface extractSpectrumResponse {
  /** Puntos medios elegidos para la extracción */
  mediasPoints: Point[]
  /** Apertura promedio detectada */
  opening: number
  /** Funcion de la recta media del espectro medida en pixels */
  rectFunction: (value: number) => number
  /**
   * Promedio por columna (vertical respecto a la imagen) de los pixels pasan
   * por rectFunction dentro de la apertura.
   */
  transversalAvgs: number[]
}
/** Extrae las caracteristicas de un espectro de ciencia. */
export function extractScience({
  science,
  width,
  height,
  countCheckpoints,
  segmentWidth,
  fitFunction,
}: extractScienceProps): extractSpectrumResponse {
  /** Convertir el arreglo de pixeles recibido a tensor */
  const channels = 4 // Imagen RGBA
  height = Math.floor(height)
  width = Math.floor(width)
  const rgba = tf.tensor4d(science, [1, height, width, channels], "int32")
  /** Convertir a escala de grises */
  const [r, g, b, _] = tf.split(rgba, 4, 3)
  const imgTensor = r.mul(0.2989).add(g.mul(0.587)).add(b.mul(0.114)).cast("float32") as tf.Tensor4D

  /** Segmentar la imagen */
  /** Coordenadas X medias a lo largo de toda la imagen de SCIENCE */
  const xpoints = findXspacedPoints(width, countCheckpoints)
  /** Segmentos medios de imagen de SCIENCE */
  const boxIdx = tf.tensor1d(new Array(countCheckpoints).fill(0), "int32")
  const cropSize: [number, number] = [height, segmentWidth]
  const boxesVals = xpoints.map((x) => {
    const start = Math.max(0, x - Math.floor(segmentWidth / 2))
    const end = Math.min(width, x + Math.ceil(segmentWidth / 2))
    return [0 / height, start / width, height / height, end / width]
  })
  const boxes = tf.tensor2d(boxesVals, [countCheckpoints, 4], "float32")
  let segments = tf.image.cropAndResize(imgTensor, boxes, boxIdx, cropSize, "nearest") // [countCheckpoints, height, segmentWidth, 1]
  segments = segments.squeeze() // Quita dimension de canal (countCheckpoints, height, segmentWidth)

  /**
   * Funciones de cada segmento promediado horizontalmente
   * Osea, para cada pixel vertical se hace un avg de los pixeles
   * horizontales. x=>pixelVertical, y=>avgHorizontal
   */
  const avgTensor = segments.mean(2) // 2 corresponde a widht, (countCheckpoints, segmentCount, height)

  /** Normalizar min-max por fila*/
  const min = avgTensor.min(1, true)
  const max = avgTensor.max(1, true)
  const avgNormalized = avgTensor.sub(min).div(max.sub(min))

  /** Pronunciar las tendencias presentes en la funcion. */
  const umbral = 0.5
  const greaterMask = avgNormalized.greater(tf.scalar(umbral))
  const ones = tf.onesLike(avgTensor)
  const zeros = tf.zerosLike(avgTensor)
  const pushed = ones.where(greaterMask, zeros)

  /** Suavizar para eliminar baches pequeños. */
  let window = Math.round(height * 0.15)
  window = window % 2 === 1 ? window : window + 1
  const k = tf.tensor3d(Array(window).fill(1 / window), [window, 1, 1])
  const pushed_smoothed = pushed.expandDims(2).conv1d(k, 1, "same").squeeze()

  /**
   * Arreglo con informacion de para cada funcion de un segmento el
   * punto vertical medio y la apartura que le corresponde.
   */
  const avgArrs: number[][] = pushed_smoothed.arraySync() as number[][]
  const plateauInfo: {
    medium: number
    opening: number
  }[] = avgArrs.map((arr: number[]) => findPlateau(arr, umbral))

  // for (let i = 0; i < countCheckpoints; i++) {
  // 	const filaTensor = avgTensor.slice([i, 0], [1, height]);
  // 	const filaData = filaTensor.dataSync();
  // 	const smoothed = weightedSmooth(Array.from(filaData), window);
  // 	const pushedi = pushed.slice([i, 0], [1, height]).squeeze();
  // 	const pushed_smoothedi = pushed_smoothed
  // 		.slice([i, 0], [1, height])
  // 		.squeeze();
  // 	guardarFuncion(
  // 		[
  // 			Array.from(filaData),
  // 			smoothed,
  // 			pushedi.arraySync() as number[],
  // 			pushed_smoothedi.arraySync() as number[],
  // 		],
  // 		`function${i}.png`,
  // 		plateauInfo[i].medium,
  // 		umbral,
  // 		["blue", "green", "yellow", "orange"],
  // 	);
  // }

  /** Apertura promedio */
  const avgOpening =
    (plateauInfo.reduce((sum, pi) => sum + pi.opening, 0) / plateauInfo.length) * 0.99 // 0.9 margen para evitar bordes

  /**
   * Conjuntos de cordenadas (x,y) de los puntos que trazan la recta
   * media de la función.
   */
  const mediasPoints = xpoints.map((point, index) => ({
    x: point,
    y: plateauInfo[index].medium,
  }))

  // Infiere funcion medio del espectro
  const interpolated: {
    funct: (x: number) => number
    derived: (x: number) => number
  } =
    fitFunction === "spline"
      ? splineCuadratic(
          xpoints,
          mediasPoints.map((p) => p.y),
        )
      : linearRegressionWhitDerived(
          xpoints,
          mediasPoints.map((p) => p.y),
        )

  // /** Conseguir valores perpendiculares a promediar en cada punto */
  // function demo() {
  // 	//
  // 	// const xVals = tf.range(0, width, 1, "int32");
  // 	// const yVals = tf.tensor1d(
  // 	// 	xVals.arraySync().map((x) => interpolated.funct(x)),
  // 	// );
  // 	// const sourceVals = tf.stack([xVals, yVals]);
  // 	// const mVals = tf.tensor1d(
  // 	// 	xVals.arraySync().map((x) => interpolated.derived(x)),
  // 	// );
  // 	// const angles = mVals.atan();
  // 	// const anglesDeg = angles.mul(180 / Math.PI); // HAberiguar si es con angulos o radianes
  // 	// const cos = angles.cos();
  // 	// const sin = angles.sin();
  // 	// const rotationMatrices = tf.stack(
  // 	// 	[
  // 	// 		tf.stack([cos, sin.neg()], 1), // fila 1: [cos, -sin]
  // 	// 		tf.stack([sin, cos], 1), // fila 2: [sin, cos]
  // 	// 	],
  // 	// 	1,
  // 	// );
  // 	// const n = Math.floor(avgOpening);
  // 	// let points = tf.stack([tf.linspace(-n / 2, n / 2, n), tf.zeros([n])], 1);
  // 	// points = points.expandDims(0).tile([width, 1, 1]); // [n, n, 2]
  // 	// // const rotatedPoints = tf.matMul(points, rotationMatrices); // [N, n, 2]
  // 	// // rotatedPoints = rotatedPoints.add(sourceVals.transpose().expandDims(1));
  // 	const xvals = tf.tensor1d([-2, -1, 0, 1, 2]);
  // 	const yvals = tf.tensor1d([0, 0, 0, 0, 0]);
  // 	const sourceVals = tf.stack([xVals, yVals]);

  // 	guardarRectaYPuntos(sourceVals.arraySync() as [number, number][], {
  // 		b: 0,
  // 		m: 0.5,
  // 	});
  // }
  // demo();

  /** Promedio de pixeles que pasan por cada scienceTransversalFunction. Solo funciona con regresion lineal*/
  /** Rotar para que la pendiente quede horizontal */
  const rad = Math.atan(interpolated.derived(0))
  const rotated4d = tf.image.rotateWithOffset(imgTensor, -rad, 0, [0.5, 0.5])
  // imgTensor: [1, height, width, 1]  — escala de grises en 4D
  const gray2d = rotated4d.squeeze([0, 3]) // [height, width]
  /** Valores por pixel horizontal en eje X e Y */
  const xValues = tf.range(0, width, 1, "int32").arraySync()
  const yvalues = tf.tensor1d(xValues.map((x) => interpolated.funct(x)))
  /** Minimo Y por pixel */
  const minYs = yvalues.sub(tf.scalar(avgOpening / 2))
  /** Maximo Y por pixel */
  const maxYs = yvalues.add(tf.scalar(avgOpening / 2))
  /** Tensor de coordenadas verticales: shape [height, width] => [0, 1, 2, ..., height-1]*/
  const rowIndices = tf.range(0, height, 1, "int32")
  const rowMatrix = tf.tile(rowIndices.expandDims(1), [1, width])
  /** Filtrar valores por columna que no entran entre el min y max de la columna */
  const maskLower = rowMatrix.greater(minYs)
  const maskUpper = rowMatrix.less(maxYs)
  const fullMask = tf.logicalAnd(maskLower, maskUpper)
  let imgMasked = tf.where(fullMask, gray2d, tf.fill([height, width], 0))
  /** Promediar por columna */
  const validPerColumn = fullMask.cast("int32").sum(0)
  const avgPerColumn = imgMasked.sum(0).div(validPerColumn)

  imgMasked = imgMasked.expandDims(0).expandDims(-1) // → [1, height, width, 1]
  // downloadGrayscaleImage(imgMasked as tf.Tensor<tf.Rank.R4>, "roted.png");
  imgMasked = tf.image.rotateWithOffset(imgMasked as tf.Tensor<tf.Rank.R4>, rad, 0, [0.5, 0.5])
  // downloadGrayscaleImage(imgMasked as tf.Tensor<tf.Rank.R4>, "unroted.png");

  return {
    mediasPoints: mediasPoints,
    opening: avgOpening,
    rectFunction: interpolated.funct,
    transversalAvgs: avgPerColumn.arraySync() as number[],
  }
}

/**
 * Parametros recibidos por extractLamp
 * @interface extractLamp
 */
export interface extractLampProps {
  /** Información de caracteristicas del espectro de ciencia */
  science: {
    /** Ancho de la imagen */
    width: number
    /** Alto de la imagen */
    height: number
    /** Puntos medios elegidos para la extracción */
    mediasPoints: Point[]
    /** Apertura promedio*/
    opening: number
    /** Funcion de la recta media del espectro medida en pixels */
    rectFunction: (value: number) => number
    /**
     * Promedio por columna (vertical respecto a la imagen) de los pixels pasan
     * por rectFunction dentro de la apertura.
     */
    transversalAvgs: number[]
  }
  /** Matriz de pixeles */
  lamp: Uint8Array
  /** Ancho de imagen */
  width: number
  /** Alto de imagen */
  height: number
  /** Cantidad de puntos intermedios a usar */
  countCheckpoints: number
  /** Ancho a considerar para el analisis de segmentos */
  segmentWidth: number
  /** Funcion de ajuste a usar */
  fitFunction?: "linal-regression" | "spline"
}

/** Extrae las caracteristicas de un espectro de lampara de comparación. */
export function extractLamp({
  science,
  lamp,
  width,
  height,
}: extractLampProps): extractSpectrumResponse {
  /** Convertir el arreglo de pixeles recivido a tensor */
  const channels = 4 // Imagen RGBA
  height = Math.floor(height)
  width = Math.floor(width)
  const rgba = tf.tensor4d(lamp, [1, height, width, channels], "int32")
  /** Convertir a escala de grises */
  const [r, g, b, _] = tf.split(rgba, 4, 3)
  const imgTensor = r.mul(0.2989).add(g.mul(0.587)).add(b.mul(0.114)).cast("int32") as tf.Tensor4D

  /**
   * Relacion de escala de lampara respecto al espectro de ciencia.
   * sciencePoint * scale === lampPoint
   */
  const scale = {
    x: width / science.width,
    y: height / science.height,
  }

  /**
   * Puntos medios del espectro de lampara.
   * Reusar los puntos de ciencia escalandolos.
   */
  const mediasPoints: { x: number; y: number }[] = science.mediasPoints.map(({ x, y }) => ({
    x: round(x * scale.x),
    y: y * scale.y,
  }))

  /**
   * Apertura promedio de lampara. La del espectro pero escalada
   * en respecto a Y.
   */
  const avgOpening = science.opening

  /**
   * Funcion media para Lampara
   * Se reusa la del espectro de ciencia pero escalada.
   * */
  const mediaFunction: (value: number) => number = (x: number) =>
    science.rectFunction(round(x / scale.x)) / scale.y

  /** Promedio de pixeles que verticales que pasan por mediaFunction. */
  // imgTensor: [1, height, width, 1]  — escala de grises en 4D
  const gray2d = imgTensor.squeeze([0, 3]) // [height, width]
  /** Valores por pixel horizontal en eje X e Y */
  const xValues = tf.range(0, width, 1, "int32").arraySync()
  const yvalues = tf.tensor1d(xValues.map((x) => mediaFunction(x)))
  /** Minimo Y por pixel */
  const minYs = yvalues.sub(tf.scalar(avgOpening / 2))
  /** Maximo Y por pixel */
  const maxYs = yvalues.add(tf.scalar(avgOpening / 2))
  /** Tensor de coordenadas verticales: shape [height, width] => [0, 1, 2, ..., height-1]*/
  const rowIndices = tf.range(0, height, 1, "int32")
  const rowMatrix = tf.tile(rowIndices.expandDims(1), [1, width])
  /** Filtrar valores por columna que no entran entre el min y max de la columna */
  const maskLower = rowMatrix.greater(minYs)
  const maskUpper = rowMatrix.less(maxYs)
  const fullMask = tf.logicalAnd(maskLower, maskUpper)
  const imgMasked = tf.where(fullMask, gray2d, tf.fill([height, width], 0))
  /** Promediar por columna */
  const validPerColumn = fullMask.cast("int32").sum(0)
  const avgPerColumn = imgMasked.sum(0).div(validPerColumn)

  return {
    mediasPoints: mediasPoints,
    opening: avgOpening,
    rectFunction: mediaFunction,
    transversalAvgs: avgPerColumn.arraySync() as number[],
  }
}

export interface extractFeaturesResponse<T extends Uint8Array | Uint8ClampedArray | Buffer> {
  scienceInfo: {
    data: T
    width: number
    height: number
  } | null
  scienceMediasPoints: Point[]
  scienceAvgOpening: number
  scienceFunction: ((value: number) => number) | null
  scienceTransversalFunctions: {
    m: number
    funct: (h: number) => number
  }[]
  scienceTransversalAvgs: number[]
  lamp1MediasPoints: Point[]
  lamp1AvgOpening: number
  lamp1Function: ((value: number) => number) | null
  lamp1TransversalFunctions: {
    m: number
    funct: (h: number) => number
  }[]
  lamp1TransversalAvgs: number[]
  lamp2MediasPoints: Point[]
  lamp2AvgOpening: number
  lamp2Function: ((value: number) => number) | null
  lamp2TransversalFunctions: {
    m: number
    funct: (h: number) => number
  }[]
  lamp2TransversalAvgs: number[]
}

export function extractFeatures<T extends Uint8Array | Uint8ClampedArray | Buffer>(
  countCheckpoints: number,
  segmentWidth: number,
  science: { data: T; width: number; height: number },
  lamp1: { data: T; width: number; height: number },
  lamp2: { data: T; width: number; height: number },
  useSpline?: boolean,
  reuseScienceFunction?: boolean,
): extractFeaturesResponse<T> {
  /** Resultados a devolver */
  let response: extractFeaturesResponse<T> = {
    scienceInfo: null,
    scienceMediasPoints: [],
    scienceAvgOpening: 0,
    scienceFunction: null,
    scienceTransversalFunctions: [],
    scienceTransversalAvgs: [],
    lamp1MediasPoints: [],
    lamp1AvgOpening: 0,
    lamp1Function: null,
    lamp1TransversalFunctions: [],
    lamp1TransversalAvgs: [],
    lamp2MediasPoints: [],
    lamp2AvgOpening: 0,
    lamp2Function: null,
    lamp2TransversalFunctions: [],
    lamp2TransversalAvgs: [],
  }

  let bag: extractFeaturesResponse<T> = {
    scienceInfo: null,
    scienceMediasPoints: [],
    scienceAvgOpening: 0,
    scienceFunction: null,
    scienceTransversalFunctions: [],
    scienceTransversalAvgs: [],
    lamp1MediasPoints: [],
    lamp1AvgOpening: 0,
    lamp1Function: null,
    lamp1TransversalFunctions: [],
    lamp1TransversalAvgs: [],
    lamp2MediasPoints: [],
    lamp2AvgOpening: 0,
    lamp2Function: null,
    lamp2TransversalFunctions: [],
    lamp2TransversalAvgs: [],
  }

  // Obtener informacion de imagen SCIENCE
  bag.scienceInfo = {
    data: science.data,
    width: science.width,
    height: science.height,
  }

  // Segmentar la imagen
  /** Coordenadas X medias a lo largo de toda la imagen de SCIENCE */
  const sciencePoints = findXspacedPoints(science.width, countCheckpoints)
  /** Segmentos medios de imagen de SCIENCE */
  const segmentsData = obtainImageSegments(
    science.data,
    science.width,
    science.height,
    sciencePoints,
    segmentWidth,
  )
  for (const sd of segmentsData) {
    if (sd.length !== segmentWidth * science.height * 4)
      console.warn("Segment size mismatch:", sd.length, segmentWidth * science.height * 4)
  }

  /**
   * Funciones de cada segmento promediado horizontalmente
   * Osea, para cada pixel vertical se hace un avg de los pixeles
   * horizontales. x=>pixelVertical, y=>avgHorizontal
   */
  const scienceFunctions = segmentsData.map((data) =>
    promediadoHorizontal(data, segmentWidth, science.height),
  )

  /**
   * Arreglo con informacion de para cada funcion de un segmento el
   * punto vertical medio y la apartura que le corresponde.
   */
  const sciencePlateauInfo: {
    medium: number
    opening: number
  }[] = scienceFunctions.map((funct) => findPlateau(funct, 0.5))

  /** Apertura promedio */
  const avgOpening = mean(sciencePlateauInfo.map((pi) => pi.opening))
  bag.scienceAvgOpening = avgOpening

  /**
   * Conjuntos de cordenadas (x,y) de los puntos que trazan la recta
   * media de la función.
   */
  const scienceMediasPoints = sciencePoints.map((point, index) => ({
    x: point,
    y: sciencePlateauInfo[index]?.medium ?? 0,
  }))
  bag.scienceMediasPoints = scienceMediasPoints

  // Infiere funcion medio del espectro
  let interpolated: {
    funct: (x: number) => number
    derived: (x: number) => number
  }
  if (useSpline) {
    // Aproximación spline
    interpolated = splineCuadratic(
      scienceMediasPoints.map((p) => p.x),
      scienceMediasPoints.map((p) => p.y),
    )
  } else {
    // Aproximación lineal
    interpolated = linearRegressionWhitDerived(
      scienceMediasPoints.map((p) => p.x),
      scienceMediasPoints.map((p) => p.y),
    )
  }
  bag.scienceFunction = interpolated.funct

  /**
   * Arreglo de funciones que para cada punto de la recta, dada una altura Y
   * indica el pixel X que le corresponde.
   */
  const scienceTransversalFunctions: {
    m: number
    funct: (h: number) => number
  }[] = []
  for (let i = 0; i < science.width; i++) {
    const p1 = { x: i, y: interpolated.funct(i) }
    // // Perpendicular a la recta.
    // const m_perp = -1 / derived(i)
    // const b = p1.y - m_perp * p1.x
    // scienceTransversalFunctions.push({
    //   m: m_perp,
    //   funct: (y: number) => ((y - b) / m_perp), // Para cada Y me da ele x que le corresponde.
    // })
    // Perpendicular a la imagen.
    scienceTransversalFunctions.push({
      m: Infinity,
      funct: (_y: number) => p1.x, // Para cada Y me da ele x que le corresponde.
      // En el caso Vertical siempre va a ser el X del punto.
    })
  }
  bag.scienceTransversalFunctions = scienceTransversalFunctions

  /** Promedio de pixeles que pasan por cada scienceTransversalFunction. */
  const scienceTransversalAvgs: number[] = []
  for (let i = 0; i < scienceTransversalFunctions.length; i++) {
    const point = { x: i, y: interpolated.funct(i) }
    /** Punnto inicial y final a considerar para promediado consiiderando la apertura */
    const { forward, backward } = extremePoints(
      point,
      scienceTransversalFunctions[i].m,
      avgOpening / 2,
    )

    /** Punto minimo de la recta en Y */
    const minY = round(min(forward.y, backward.y))
    /** Punto maximo de la recta en Y */
    const maxY = round(max(forward.y, backward.y))

    /** Valor numerico de todos los puntos por los que pasa la recta */
    const values: number[] = getPointsInRect(
      science.data,
      science.width,
      scienceTransversalFunctions[i].funct,
      minY,
      maxY,
    )

    // si no hay valores entonces devuelve 0
    if (values.length === 0) scienceTransversalAvgs.push(0)
    else scienceTransversalAvgs.push(mean(values))
  }
  bag.scienceTransversalAvgs = scienceTransversalAvgs

  // Lampara 1 datos relevantes.
  // Obtener informacion de imagen de Lamp1
  const lamp1Data = extractLampData({
    science: {
      ...science,
      mediasPoints: bag.scienceMediasPoints,
      avgOpening: bag.scienceAvgOpening,
      mediaFunction: bag.scienceFunction!,
    },
    lamp: lamp1,
    reuseScienceFunction,
    useSpline,
    countCheckpoints,
    segmentWidth,
  })

  // Actualizar salida del metodo con informacion de lamp1
  bag = {
    ...bag,
    lamp1MediasPoints: lamp1Data.mediasPoints,
    lamp1AvgOpening: lamp1Data.avgOpening,
    lamp1Function: lamp1Data.mediaFunction,
    lamp1TransversalFunctions: lamp1Data.transversalFunctions,
    lamp1TransversalAvgs: lamp1Data.transversalAvgs,
  }

  // Lampara 2 datos relevantes.
  // Obtener informacion de imagen de Lamp2
  // Las invocaciones tienen que ser anidadas por que sino
  // corremos riesgo de sobreescritura de variables entre hilos.
  const lamp2Data = extractLampData({
    science: {
      ...science,
      mediasPoints: bag.scienceMediasPoints,
      avgOpening: bag.scienceAvgOpening,
      mediaFunction: bag.scienceFunction!,
    },
    lamp: lamp2,
    reuseScienceFunction,
    useSpline,
    countCheckpoints,
    segmentWidth,
  })

  // Actualizar salida del metodo con informacion de lamp2
  bag = {
    ...bag,
    lamp2MediasPoints: lamp2Data.mediasPoints,
    lamp2AvgOpening: lamp2Data.avgOpening,
    lamp2Function: lamp2Data.mediaFunction,
    lamp2TransversalFunctions: lamp2Data.transversalFunctions,
    lamp2TransversalAvgs: lamp2Data.transversalAvgs,
  }

  response = { ...bag }

  return response
}

interface extractLampDataProps<T extends Uint8Array | Uint8ClampedArray | Buffer> {
  science: {
    data: T
    width: number
    height: number
    mediasPoints: Point[]
    avgOpening: number
    mediaFunction: (value: number) => number
  }
  lamp: {
    data: T
    width: number
    height: number
  }
  reuseScienceFunction?: boolean
  useSpline?: boolean
  countCheckpoints?: number
  segmentWidth?: number
}

interface extractLampDataResponse {
  mediasPoints: Point[]
  avgOpening: number
  mediaFunction: ((value: number) => number) | null
  transversalFunctions: {
    m: number
    funct: (h: number) => number
  }[]
  transversalAvgs: number[]
}
function extractLampData<T extends Uint8Array | Uint8ClampedArray | Buffer>({
  science,
  lamp,
  reuseScienceFunction,
  useSpline,
  countCheckpoints,
  segmentWidth,
}: extractLampDataProps<T>): extractLampDataResponse {
  const response: extractLampDataResponse = {
    mediasPoints: [],
    avgOpening: 0,
    mediaFunction: null,
    transversalFunctions: [],
    transversalAvgs: [],
  }
  /**
   * Relacion de escala de lampara respecto al espectro de ciencia.
   * valorLamp * scaleLamp === equivalenteScience
   */
  const scaleLamp = {
    x: science.width / lamp.width,
    y: science.height / lamp.height,
  }

  /**
   * Puntos medios del espectro de lampara.
   * Calculados escalando los puntos del espectro de ciencia.
   */
  let mediasPoints: { x: number; y: number }[]
  if (reuseScienceFunction) {
    // Reusar los del espectro de ciencia pero los escala.
    mediasPoints = science.mediasPoints.map(({ x, y }) => ({
      x: round(x * scaleLamp.x),
      y: y * scaleLamp.y,
    }))
  } else {
    // Infiere los suyos.
    const lampPoints = findXspacedPoints(science.width, countCheckpoints!)

    const segmentsData = obtainImageSegments(
      lamp.data,
      lamp.width,
      lamp.height,
      lampPoints,
      segmentWidth!,
    )
    const lampFunctions = segmentsData.map((data) =>
      promediadoHorizontal(data, segmentWidth!, science.height),
    )

    const lampPlateauInfo: {
      medium: number
      opening: number
    }[] = lampFunctions.map((funct) => findPlateau(funct, 0.5))
    mediasPoints = lampPoints.map((point, index) => ({
      x: point,
      y: lampPlateauInfo[index]?.medium ?? 0,
    }))
  }
  response.mediasPoints = mediasPoints

  /** Apertura promedio de lampara. Tomamos la misma que la del espectro */
  response.avgOpening = science.avgOpening

  /** Funcion media para Lampara */
  let mediaFunction: (value: number) => number
  if (reuseScienceFunction) {
    // Reusar la del espectro de ciencia pero lo escala.
    mediaFunction = (x: number) => science.mediaFunction!(round(x * scaleLamp.x)) * scaleLamp.y
  } else {
    // Infiere la suya en base a sus medias points
    if (useSpline) {
      // Aproximación spline
      mediaFunction = splineCuadratic(
        response.mediasPoints.map((p) => p.x),
        response.mediasPoints.map((p) => p.y),
      ).funct
    } else {
      // Aproximación lineal
      mediaFunction = linearRegressionWhitDerived(
        response.mediasPoints.map((p) => p.x),
        response.mediasPoints.map((p) => p.y),
      ).funct
    }
  }
  response.mediaFunction = mediaFunction

  /** Funciones perpendiculares para Lampara 1. */
  const transversalFunctions: {
    m: number
    funct: (h: number) => number
  }[] = []
  for (let i = 0; i < lamp.width; i++) {
    const p1 = { x: i, y: mediaFunction(i) }
    // // Perpendicular a lamp1Function(i).
    // const m_perp = -1 / interpolated.derived(p1.x)
    // const b = p1.y - m_perp * p1.x
    // transversalFunctions.push({
    //   m: m_perp,
    //   funct: (y: number) => ((y - b) / m_perp), // Para cada Y me da ele x que le corresponde.
    // })
    // Perpendicular a la imagen.
    transversalFunctions.push({
      m: Infinity,
      funct: (_y: number) => p1.x, // Para cada Y me da ele x que le corresponde.
      // En el caso Vertical siempre va a ser el X del punto.
    })
  }
  response.transversalFunctions = transversalFunctions

  /** Promedio de pixeles que pasan por cada lamp1TransversalFunction. */
  const transversalAvgs: number[] = []
  for (let i = 0; i < transversalFunctions.length; i++) {
    const point = { x: i, y: mediaFunction(i) }
    const { forward, backward } = extremePoints(
      point,
      transversalFunctions[i].m,
      response.avgOpening / 2,
    )

    const minY = round(min(forward.y, backward.y))
    const maxY = round(max(forward.y, backward.y))
    const values: number[] = getPointsInRect(
      lamp.data,
      lamp.width,
      transversalFunctions[i].funct,
      minY,
      maxY,
    )

    if (values.length === 0) transversalAvgs.push(0)
    else transversalAvgs.push(mean(values))
  }
  response.transversalAvgs = transversalAvgs

  return response
}
