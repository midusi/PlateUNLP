import * as tf from "@tensorflow/tfjs"
import { max as mathjsMax, min as mathjsMin, round } from "mathjs"
import { levenbergMarquardt } from "ml-levenberg-marquardt"

/**
 * Loads an image from a given source URL as a Promise.
 * @param {string} src - image source URL.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (reason) => reject(reason)
    img.src = src
  })
}

/**
 * Dada una imagen en un src devuelve una subimagen acorde a las especificaciones de recorte.
 * @param {string} src - Source url.
 * @param {{left: number, top: number, width: number, height: number}[]} regions - Regiones
 * a recortar.
 * @returns {Promise<{data:Uint8Array,width: number,height: number}[]>} - Subimagenes codificadas como
 * matrices de pixeles.
 */
export function crop(
  src: string,
  regions: {
    left: number
    top: number
    width: number
    height: number
  }[],
): Promise<
  {
    data: Uint8Array
    width: number
    height: number
  }[]
> {
  return new Promise((resolve, reject) => {
    // Me estoy dando cuenta que esto se puede mejorar haciendo que con
    // un solo canvas recortar multiples  subimagenes, puede ser?
    const image = new Image()
    image.src = src

    image.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return reject(new Error("Could not get canvas context"))

      const results: {
        data: Uint8Array
        width: number
        height: number
      }[] = []
      for (const { left, top, width, height } of regions) {
        canvas.width = width
        canvas.height = height
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(image, left, top, width, height, 0, 0, width, height)
        const data = ctx.getImageData(0, 0, width, height).data
        results.push({
          data: new Uint8Array(data.buffer.slice(0)),
          width,
          height,
        })
      }

      resolve(results)
    }

    image.onerror = (err) => reject(err)
  })
}

/**
 * Retorna los valores (en grises) de los pixeles de una imagen que corresponden a las
 * coordenadas por las que pasa una recta.
 * @template T Tipo de dato binario: Buffer, Uint8ClampedArray, Uint8Array, etc.
 * @param {T} data - Imagen.
 * @param {number} width - Ancho de la matriz.
 * @param {(y: number) => number} rect - Recta que dado un y indica que x le corresponde
 * @param {number} minY - Valor Y minimo.
 * @param {number} maxY - Valor Y Maximo.
 * @returns {number[]} - Arreglo de valores que corresponden a las coordenadas por las
 * que pasa la funcion.
 */
export function getPointsInRect<T extends Uint8Array | Uint8ClampedArray | Buffer>(
  data: T,
  width: number,
  rect: (y: number) => number,
  minY: number,
  maxY: number,
): number[] {
  const rectPoints: number[] = []
  for (let y = minY; y < maxY; y++) {
    // Dada una recta, Para cada pixel vertical
    /** Coordenada X que le corresponde a un determinado Y. */
    const coordenadaX = round(rect(y))
    if (coordenadaX < 0 || coordenadaX >= width) continue
    // Valor correspondiente a imagen en pixel (coordenadaX, y)
    const index = (y * width + coordenadaX) * 4
    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    /** Promedio de valores de pixel en canales r, g, b. */
    const avg = round((r + g + b) / 3)
    rectPoints.push(avg)
  }
  return rectPoints
}

/**
 * Dada una funcion busca el altiplano mas prominente que posea.
 * @param {number[]} dataY - Datos en el eje Y de la funcion.
 * @param {number} threshold - Umbral Porcentual entre 0 y 1 de
 * la altura minima a considerar para el corte de altiplano.
 * @returns {medium: number, opening: number} -
 * Media y Tamaño de apertura del altiplano encontrado. Ambos en
 * relacion al eje X.
 */
export function findPlateau(
  dataY: number[],
  threshold: number,
): {
  medium: number
  opening: number
} {
  const minY = 0 // mathjsMin(dataY)
  const maxY = mathjsMax(dataY)

  const scaledThreshold = minY + (maxY - minY) * threshold

  const segments: { values: number[]; indexes: number[] }[] = []
  let currentValues: number[] = []
  let currentIndexes: number[] = []
  for (let i = 0; i < dataY.length; i++) {
    const d = dataY[i]
    if (d > scaledThreshold) {
      currentValues.push(d)
      currentIndexes.push(i)
    } else {
      // Si la lista tiene algo entonces es el primero que no cumple
      // entonces añadimos el segmento a la lista y reiniciamos
      // actualSegment. Si no es el primero no hacemos algo.
      if (currentValues.length > 0) {
        segments.push({
          values: currentValues,
          indexes: currentIndexes,
        })
        currentValues = []
        currentIndexes = []
      }
    }
  }

  // En caso de que el segmento más largo esté al final del array
  if (currentValues.length > 0) {
    segments.push({ values: currentValues, indexes: currentIndexes })
  }

  // ⚠️ Chequeo de seguridad:
  if (segments.length === 0) {
    // No se encontró altiplano -> devolver valores por defecto
    return { medium: 0, opening: 0 }
  }

  const moreLargeSegmentIdx = segments
    .map((segment) => segment.values.length)
    .reduce((maxIdx, currVal, idx, arr) => (currVal > arr[maxIdx] ? idx : maxIdx), 0)

  // const _plateauValues = segments[moreLargeSegmentIdx].values
  const plateauIndexes = segments[moreLargeSegmentIdx].indexes

  const opening = plateauIndexes[plateauIndexes.length - 1] - plateauIndexes[0]
  const medium = (plateauIndexes[0] + plateauIndexes[plateauIndexes.length - 1]) / 2

  // console.log({
  //   segments,
  //   moreLargeSegmentIdx,
  //   opening,
  //   medium
  // })

  return { medium, opening }
}

/**
 * Ajusta una funcion Gaussiana a un arreglo de datos.
 * @param {number[]} dataY - Datos en el eje Y de la funcion a ajustar.
 * @param {number} maxIterations - Cantidad maxima de iteraciones a
 * realizar para ajustar la Gaussiana.
 * @returns {{a: number, mu: number, sigma: number}} -
 * Parametros de la funcion gaissiana ajustada.
 */
export function fitGaussian(
  dataY: number[],
  maxIterations: number,
): { a: number; mu: number; sigma: number } {
  const gaussian =
    ([a, mu, sigma]: number[]) =>
    (x: number) =>
      a * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2))

  const dataX = dataY.map((_, index) => index)

  const options = {
    damping: 1.5,
    initialValues: [1, Math.round(dataY.length / 2), 1], // a, mu, sigma
    maxIterations,
  }

  const fit = levenbergMarquardt({ x: dataX, y: dataY }, gaussian, options)

  return {
    a: fit.parameterValues[0],
    mu: fit.parameterValues[1],
    sigma: fit.parameterValues[2],
  }
}

/**
 * Promedia los pixeles horizontales de una imagen y retorna un vector con los
 * resultados de promediar a cada altura.
 * @template T Tipo de dato binario: Buffer, Uint8ClampedArray, Uint8Array, etc.
 * @param {T} image - Imagen.
 * @param {number} width - Ancho de la imagen
 * @param {number} height - Alto de la imagen
 * @returns {number[]} - Vector con valores promediados.
 */
export function promediadoHorizontal<T extends Uint8Array | Uint8ClampedArray | Buffer>(
  image: T,
  width: number,
  height: number,
): number[] {
  const avgArr = []
  for (let y = 0; y < height; y++) {
    let sum = 0
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const r = image[index]
      const g = image[index + 1]
      const b = image[index + 2]

      // Calculo de intensidad
      // const gray = 0.299 * r + 0.587 * g + 0.114 * b // Ponderado
      const gray = (r + g + b) / 3 // Balanceado
      sum += gray
    }
    avgArr.push(sum / width)
  }

  return avgArr
}

/**
 * Transforma una imagen en formato matriz a una url.
 * @param {Uint8ClampedArray} data - Imagen
 * @param {number} width - Ancho
 * @param {number} height - Alto
 * @returns {string} Url correspondiente a la imagen.
 */
export function matrixToUrl(data: Uint8ClampedArray, width: number, height: number): string {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx) return ""

  const imageData = new ImageData(data, width, height)
  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL("image/png")
}

/**
 * En un valor numerico busca las pocisiones de N puntos medios.
 * @param {number} large - Numero entre el que se quieren hallar puntos medios
 * @param {number} n - Cantidad de puntos medios buscada
 * @returns {number[]} -
 * Puntos medios encontrados
 * ej: [-.--.--.--.--.-] batch size=--, n=2
 */
export function findXspacedPoints(large: number, n: number): number[] {
  const batchSize = Math.floor(large / n)
  const arrOfPoints = []
  for (let i = 0; i < n; i++) {
    arrOfPoints.push(Math.round(i * batchSize + batchSize / 2))
  }
  return arrOfPoints
}

/**
 * Obtiene segmentos de una imagen dependiendo de como este ordenada, los segmentos
 * son tan anchos/altos como el 1er criterio de ordenacion (filas/columnas) y la
 * dimencion restante se indica por parametro.
 * @template T Tipo de dato binario: Buffer, Uint8ClampedArray, Uint8Array, etc.
 * @param {T} image - Imagen a segmentar (tipo binario compatible con indexado).
 * @param {number} width - Ancho de la imagen
 * @param {number} height - Alto de la imagen
 * @param {number[]} points - Arreglo de puntos respecto a la 1ra dimencion de orden
 * que indican el centro de cada segmento.
 * @param {number} segmentWidth - Que tanto se extienden los segmentos respecto la
 * dimension restante.
 * @returns {T[]} - Arreglo de segmentos de la imagen recibida.
 */
export function obtainImageSegments<T extends Uint8Array | Uint8ClampedArray | Buffer>(
  image: T,
  width: number,
  height: number,
  points: number[],
  segmentWidth: number,
): T[] {
  /** Constructor de Buffer que acorde al tipo recibido */
  const SegmentConstructor = image.constructor as { new (length: number): T }

  /** Arreglo donde se guardaron los segmentos producidos */
  const segments: T[] = []

  for (const centerX of points) {
    const startX = Math.max(0, centerX - Math.floor(segmentWidth / 2))
    const endX = Math.min(width, centerX + Math.ceil(segmentWidth / 2))

    const segment = new SegmentConstructor((endX - startX) * height * 4)

    for (let y = 0; y < height; y++) {
      for (let x = startX; x < endX; x++) {
        const srcIdX = (y * width + x) * 4
        const destIdx = (y * (endX - startX) + (x - startX)) * 4

        segment[destIdx] = image[srcIdX] // R
        segment[destIdx + 1] = image[srcIdX + 1] // G
        segment[destIdx + 2] = image[srcIdX + 2] // B
        segment[destIdx + 3] = image[srcIdX + 3] // A
      }
    }

    segments.push(segment)
  }

  return segments
}

/**
 * Funcion que dado una matriz ordenado por filas la ordena por columnas.
 * @param {Uint8ClampedArray} data - Matriz.
 * @param {number} width - Ancho de la matriz
 * @param {number} height - Alto de la matriz
 * @returns {Uint8ClampedArray} -
 * Matriz ordenada por columnas
 */
function invertOrder(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const colMajorData = new Uint8ClampedArray(data.length)

  let idx = 0
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4
      colMajorData[idx++] = data[i] // R
      colMajorData[idx++] = data[i + 1] // G
      colMajorData[idx++] = data[i + 2] // B
      colMajorData[idx++] = data[i + 3] // A
    }
  }

  return colMajorData
}

/**
 * Funcion que dada una imagen retorna su matriz de pixeles
 * @param {string} src - Src de la imagen.
 * @param {boolean} colMajor - Indicador si los datos tienen que estar
 * ordenados por columnas.
 * @returns {Promise<{
 * data: Uint8ClampedArray,
 * width: number,
 * height: number}>} -
 * El arreglo de pixeles correspondiente a la imagen, el ancho de la
 * imagen, el alto de la imagen.
 */
export async function obtainimageMatrix(
  src: string,
  colMajor?: boolean,
): Promise<{
  data: Uint8ClampedArray
  width: number
  height: number
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.crossOrigin = "Anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      if (!canvas) return
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      let { data, width, height } = imageData
      if (colMajor) data = invertOrder(data, width, height)

      resolve({ data, width, height })
    }
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"))
  })
}

/**
 * Revisa la alineacion vertical|horizontal de una imagen, si es vertical la vuelve horizontal.
 * @param {string} imageb64 - La imagen a alinear.
 * @returns {Promise<{ image:string, degrees: number }>} -
 * Una promesa que contiene la imagen procesada y la cantidad de grados rotados.
 */
export async function align(imageb64: string): Promise<{ image: string; degrees: number }> {
  // Cargar imagen
  const image = new Image()
  image.src = imageb64
  await new Promise((resolve) => {
    image.onload = resolve
  })

  // alto & ancho
  const { naturalWidth, naturalHeight } = image

  // Si es mas alta que ancha la gira 90º
  let imageProcessed = imageb64
  let degrees = 0
  if (naturalHeight > naturalWidth) {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("No se pudo obtener el contexto del canvas")

    canvas.width = naturalHeight
    canvas.height = naturalWidth

    ctx.translate(naturalHeight, 0)
    ctx.rotate(Math.PI / 2) // 90º

    ctx.drawImage(image, 0, 0)

    imageProcessed = canvas.toDataURL()
    degrees = 90
  }

  return { image: imageProcessed, degrees }
}

/**
 * Rota una imagen la cantidad de grados que se especifique.
 * @param {string} imageb64 - La imagen a rotar.
 * @param {90 | 180 | 270} degrees - Cantidad de grados a rotar
 * @returns {Promise<string>} -
 * Una promesa que contiene la imagen rotada.
 */
export async function rotate(imageb64: string, degrees: 90 | 180 | 270): Promise<string> {
  // Cargar imagen
  const image = new Image()
  image.src = imageb64
  await new Promise((resolve) => {
    image.onload = resolve
  })

  // alto & ancho
  const { naturalWidth, naturalHeight } = image

  // Si es mas alta que ancha la gira 90º
  let imageProcessed = imageb64

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo obtener el contexto del canvas")

  canvas.width = naturalHeight
  canvas.height = naturalWidth

  const rotateCoef = ((degrees / 90) * Math.PI) / 2
  if (degrees === 180) {
    canvas.width = naturalWidth
    canvas.height = naturalHeight
    ctx.translate(naturalWidth, naturalHeight)
  } else if (degrees === 90) {
    canvas.width = naturalHeight
    canvas.height = naturalWidth
    ctx.translate(naturalHeight, 0)
  } else if (degrees === 270) {
    canvas.width = naturalHeight
    canvas.height = naturalWidth
    ctx.translate(0, naturalWidth)
  }
  ctx.rotate(rotateCoef)

  ctx.drawImage(image, 0, 0)

  imageProcessed = canvas.toDataURL()

  return imageProcessed
}

/**
 * Revisa si en una imagen predomina el color Blanco o Negro.
 * @param {string} imageb64 - La imagen a revisar.
 * @returns {Promise<"white" | "black"> } -
 * Una promesa que contiene el color del fondo.
 */
export async function bgColor(imageb64: string): Promise<"white" | "black"> {
  const image = new Image()
  image.src = imageb64
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })

  // Detectar color fondo (Blanco | Negro)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  if (!ctx) throw new Error("No se pudo obtener el contexto del canvas")

  ctx.drawImage(image, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  let brightnessSum = 0

  // Fórmula de luminancia (luma)
  const getBrightness = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b

  const width = canvas.width
  const height = canvas.height

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const idx = (i * width + j) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      brightnessSum += getBrightness(r, g, b)
    }
  }

  const avgBrightness = brightnessSum / (height * width)

  // Variables de retorno
  let bgColor: "white" | "black"
  if (avgBrightness < 128) {
    bgColor = "black"
  } else {
    bgColor = "white"
  }

  return bgColor
}

/**
 * Revisa que el fondo de una funcion sea blanco si es negro invierte los colores.
 * @param {string} imageb64 - La imagen a revisar.
 * @param {"white" | "black"} targetColor - Color objetivo
 * @returns {Promise<{ image:string, bgColor: "white" | "black" }>} -
 * Una promesa que contiene la imagen procesada y un string indicando el color que quedo de fondo.
 */
export async function ensureWhite(
  imageb64: string,
  targetColor: "white" | "black",
): Promise<{ image: string; bgColor: "white" | "black" }> {
  const image = new Image()
  image.src = imageb64
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })

  // Detectar color fondo (Blanco | Negro)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  if (!ctx) throw new Error("No se pudo obtener el contexto del canvas")

  ctx.drawImage(image, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  let brightnessSum = 0

  // Fórmula de luminancia (luma)
  const getBrightness = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b

  const width = canvas.width
  const height = canvas.height

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const idx = (i * width + j) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      brightnessSum += getBrightness(r, g, b)
    }
  }

  const avgBrightness = brightnessSum / (height * width)

  // Variables de retorno
  let imageProcessed = imageb64

  // Color predominante actual
  let mainColor: "white" | "black"
  if (avgBrightness < 128) {
    mainColor = "black"
  } else {
    mainColor = "white"
  }

  // Si color predominante es distinto de objetivo lo invierte
  if (mainColor !== targetColor) {
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4
        data[idx] = 255 - data[idx]
        data[idx + 1] = 255 - data[idx + 1]
        data[idx + 2] = 255 - data[idx + 2]
      }
    }
    ctx.putImageData(imageData, 0, 0)

    imageProcessed = canvas.toDataURL()
  }

  return { image: imageProcessed, bgColor: targetColor }
}

/**
 * Converts a Uint16Array
 */
export async function grayscaleToImage() {}

/**
 * Fetches a grayscale image from a given URL. The URL must return a 16-bit
 * grayscale image in raw format.
 * @param {string} url - The URL of the image to fetch.
 * @return {Promise<tf.Tensor2D>} - A Promise that resolves to a 2D tensor
 */
export async function fetchGrayscaleImage(url: string): Promise<tf.Tensor2D> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }
  const width = parseInt(response.headers.get("X-Image-Width") || "0", 10)
  const height = parseInt(response.headers.get("X-Image-Height") || "0", 10)
  const buffer = await response.arrayBuffer()
  const uint16Array = new Uint16Array(buffer)
  return tf.tensor2d(Int32Array.from(uint16Array), [height, width], "int32")
}
