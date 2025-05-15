import type { BoundingBox } from "@/interfaces/BoundingBox"
import { BBClasses, classesSpectrumPartSegmentation } from "@/enums/BBClasses"
import { cropImages } from "@/lib/cropImage"

/**
 * Procesa un conjunto de imagenes de espectros, selecciona sus partes con
 * Bounding Boxes de forma automatica y luego extrae automaticamente sus
 * espectros 1D.
 * Guarda las imagenes de recortes y espectros en un pull.
 */
export function processSpectraPool(
  determineBBFunction: (img_src: string) => Promise<BoundingBox[]>,
) {
  const spectras = [
    "/spectras/0c5940cb-170_N1.png",
    //"/spectras/0d319ec9-107_N1.png",
    // "/spectras/0e1e1d53-99_N2.png",
    // "/spectras/0fbf6430-234_N1.png",
    // "/spectras/01a0f611-134_N1.png",
    // "/spectras/1a94799b-205_N2.png",
    // "/spectras/1a800850-189_N1.png",
    // "/spectras/1afddb97-136_N4.png",
    // "/spectras/1b4a51ce-102_N2.png",
    // "/spectras/1b07a428-19_N2.png",
    // "/spectras/1beb7e68-214_N2.png",
    // "/spectras/1d52fafc-106_N2.png",
    // "/spectras/1dc36459-138_N1.png",
    // "/spectras/1e3ca54c-164_N3.png",
    // "/spectras/2a1892bb-197_N1.png",
    // "/spectras/2b384b24-150_N1.png",
    // "/spectras/2cd2b5bb-164_N1.png",
    // "/spectras/2d7155b5-192_N2.png",
    // "/spectras/2d17222f-101_N2.png",
    // "/spectras/2de77a1b-67_N2.png",
    // "/spectras/02f7dc82-205_N1.png",
    // "/spectras/2f38ebd2-126_N1.png",
    // "/spectras/3b58cbe1-63_N2.png",
    // "/spectras/3b93bbee-153_N2.png",
    // "/spectras/3bb6e276-161_N2.png",
    // "/spectras/3ce7bd56-242_N1.png",
    // "/spectras/3d382f81-141_N1.png",
    // "/spectras/3f32806b-111_N4.png",
    // "/spectras/04ca1781-10_N1.png",
    // "/spectras/4cfb3606-167_N4.png",
    // "/spectras/4ea29f56-2_N2.png",
    // "/spectras/4edd7d3e-196_N1.png",
    // "/spectras/5aa9bd8b-70_N1.png",
    // "/spectras/5ae7005b-42_N1.png",
    // "/spectras/5bfb9be6-80_N2.png",
    // "/spectras/5c6816ad-126_N2.png",
    // "/spectras/5ce6089e-112_N1.png",
    // "/spectras/5da6ed25-65_N2.png",
    // "/spectras/05f45bbe-1_N2.png",
    // "/spectras/5fbe1801-138_N2.png",
    // "/spectras/6ae8a862-130_N2.png",
    // "/spectras/6b7ab08e-77_N2.png",
    // "/spectras/6b7ed07f-129_N1.png",
    // "/spectras/6b720b3e-14_N3.png",
    // "/spectras/6cbcadde-143_N2.png",
    // "/spectras/6e5cb440-189_N3.png",
    // "/spectras/6e57449d-112_N4.png",
    // "/spectras/6f43e92c-67_N4.png",
    // "/spectras/06f22622-70_N2.png",
    // "/spectras/6fc55c53-137_N1.png",
    // "/spectras/6fcd156d-113_N2.png",
  ]
  /** Ancho en pixeles que tendra la imagen convinada */
  const width = 600
  /** Ancho a considerar de los segmentos */
  const segmentWidth = 60
  /** Puntos intermedios para extraxion 1D */
  const countCheckpoints = 5
  /** Uso o NO de spline, regresion en su defecto */
  const useSpline = false
  /** Reusar funcion de ciencia */
  const reuseScienceFunction = true

  return Promise.all(spectras.map(async (src, idx) => {
    console.log(idx)
    const boundingBoxes = await separateParts(src, determineBBFunction)
    const bblist = [boundingBoxes.science, boundingBoxes.lamp1, boundingBoxes.lamp2]
    const partsSrcs = await cropImages(src, bblist)
    const images = await Promise.all(partsSrcs.map(loadImage))
    const resizeds = await Promise.all(images.map(img=>resize(img, width))) 

    const {
    scienceInfo,
    scienceMediasPoints,
    scienceAvgOpening,
    scienceFunction,
    scienceTransversalFunctions,
    scienceTransversalAvgs,
    lamp1MediasPoints,
    lamp1AvgOpening,
    lamp1Function,
    lamp1TransversalFunctions,
    lamp1TransversalAvgs,
    lamp2MediasPoints,
    lamp2AvgOpening,
    lamp2Function,
    lamp2TransversalFunctions,
    lamp2TransversalAvgs,
  } = useExtractFeatures(
    countCheckpoints,
    segmentWidth,
    partsSrcs[0],
    partsSrcs[1],
    partsSrcs[2],
    useSpline,
    reuseScienceFunction,
  )

    combineAndDownload(resizeds)
    return boundingBoxes
  })).then((arr) => {
    console.log("Todo Listo", arr)
    return arr
  })
}

/**
 * Procesa una unica imagen de espectro separando sus componentes
 * @returns {science:BoundingBox, lamp1:BoundingBox, lamp2:BoundingBox}
 */
async function separateParts(src: string, determineBBFunction: (img_src: string) => Promise<BoundingBox[]>): Promise<{
  science: BoundingBox
  lamp1: BoundingBox
  lamp2: BoundingBox
}> {
  const boundingBoxes = await determineBBFunction(src)
  const scienceBb = boundingBoxes.filter(bb => bb.class_info === BBClasses.Science)[0]
  const lampsBbs = boundingBoxes.filter(bb => bb.class_info === BBClasses.Lamp)
  console.log("ok1")

  return {
    science: scienceBb,
    lamp1: lampsBbs[0],
    lamp2: lampsBbs[1],
  }
}

/**
 * Recibe un src y devuelve el HTML que le corresponde
 * @param {string} src - Src de la imagen
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Combina las 3 partes de un espectro en una sola imagen y la descarga.
 * @param {HTMLImageElement[]} images - Imagenes de las partes de un espectro.
 */
function combineAndDownload(images: HTMLImageElement[]) {
  const margin = 20
  const width = Math.max(...images.map(img => img.width))
  const height = images.reduce((sum, img) => sum + img.height, 0)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height + margin * images.length
  const ctx = canvas.getContext("2d")!

  let y = 0
  for (const img of images) {
    ctx.drawImage(img, 0, y)
    y += img.height + margin
  }

  // Descargar como imagen única
  const a = document.createElement("a")
  a.href = canvas.toDataURL("image/png") 
  a.download = "combinada.png"
  a.click()
}

function resize(img:HTMLImageElement, w: number): Promise<HTMLImageElement> {
  // Redimensionamos todas las imágenes a 400px de ancho, manteniendo la relación de aspecto
  const scale = w / img.width
  const width = w
  const height = img.height * scale

  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext("2d")!
  tempCtx.drawImage(img, 0, 0, width, height)

  const resizedImg = new Image()
  resizedImg.src = tempCanvas.toDataURL("image/png")
  return new Promise<HTMLImageElement>((resolve) => {
    resizedImg.onload = () => resolve(resizedImg)
  })
}
