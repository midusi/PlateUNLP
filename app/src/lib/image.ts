/**
 * Transforma una imagen en formato matriz a una url.
 * @param {Uint8ClampedArray} data - Imagen
 * @param {number} width - Ancho
 * @param {number} height - Alto
 * @returns {string} Url correspondiente a la imagen.
 */
export function matrixToUrl(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): string {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d")
  if (!ctx)
    return ""

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
 * @param {Uint8ClampedArray} image - Imagen a segmentar
 * @param {number} width - Ancho de la imagen
 * @param {number} height - Alto de la imagen
 * @param {number[]} points - Arreglo de puntos respecto a la 1ra dimencion de orden
 * que indican el centro de cada segmento.
 * @param {number} segmentWidth - Que tanto se extienden los segmentos respecto la
 * dimension restante.
 * @returns {Uint8ClampedArray} -
 * Arreglo de segmentos de la imagen recibida.
 */
export function obtainImageSegments(
  image: Uint8ClampedArray,
  width: number,
  height: number,
  points: number[],
  segmentWidth: number,
): Uint8ClampedArray[] {
  const segments: Uint8ClampedArray[] = []

  for (const centerX of points) {
    const startX = Math.max(0, centerX - Math.floor(segmentWidth / 2))
    const endX = Math.min(width, centerX + Math.ceil(segmentWidth / 2))

    const segment = new Uint8ClampedArray((endX - startX) * height * 4)

    for (let y = 0; y < height; y++) {
      for (let x = startX; x < endX; x++) {
        const srcIdX = (y * width + x) * 4
        const destIdx = ((y * (endX - startX)) + (x - startX)) * 4

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
function invertOrder(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
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
  colMajor: boolean,
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
      if (!canvas)
        return
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx)
        return
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      let { data, width, height } = imageData
      if (colMajor)
        data = invertOrder(data, width, height)

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
export async function align(imageb64: string): Promise<{ image: string, degrees: number }> {
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
    if (!ctx)
      throw new Error("No se pudo obtener el contexto del canvas")

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
  if (!ctx)
    throw new Error("No se pudo obtener el contexto del canvas")

  canvas.width = naturalHeight
  canvas.height = naturalWidth

  const rotateCoef = (degrees / 90) * Math.PI / 2
  if (degrees === 180) {
    canvas.width = naturalWidth
    canvas.height = naturalHeight
    ctx.translate(naturalWidth, naturalHeight)
  }
  else if (degrees === 90) {
    canvas.width = naturalHeight
    canvas.height = naturalWidth
    ctx.translate(naturalHeight, 0)
  }
  else if (degrees === 270) {
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
export async function bgColor(
  imageb64: string,
): Promise<"white" | "black"> {
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

  if (!ctx)
    throw new Error("No se pudo obtener el contexto del canvas")

  ctx.drawImage(image, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  let brightnessSum = 0

  // Fórmula de luminancia (luma)
  const getBrightness = (r: number, g: number, b: number) =>
    0.299 * r + 0.587 * g + 0.114 * b

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
  }
  else {
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
): Promise<{ image: string, bgColor: "white" | "black" }> {
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

  if (!ctx)
    throw new Error("No se pudo obtener el contexto del canvas")

  ctx.drawImage(image, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  let brightnessSum = 0

  // Fórmula de luminancia (luma)
  const getBrightness = (r: number, g: number, b: number) =>
    0.299 * r + 0.587 * g + 0.114 * b

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
  }
  else {
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
