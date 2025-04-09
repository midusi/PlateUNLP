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
