import html2canvas from "html2canvas"
import { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { SimpleFunctionXY } from "~/components/molecules/SimpleFunctionXY"
import { ImageWithPixelExtraction } from "~/components/organisms/ImageWithPixelExtraction"
import { cropImages } from "~/lib/cropImage"
import { extractFeatures, type useExtractFeaturesResponse } from "~/lib/extract-features"
import { BBClasses } from "~/types/BBClasses"
import type { BoundingBox } from "~/types/BoundingBox"

/**
 * Procesa un conjunto de imagenes de espectros, selecciona sus partes con
 * Bounding Boxes de forma automatica y luego extrae automaticamente sus
 * espectros 1D.
 * Guarda las imagenes de recortes y espectros en un pull.
 */
export function useProcessSpectraPool(
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

  const [partSrcs, setPartSrcs] = useState<{
    science: string
    lamp1: string
    lamp2: string
  }>()
  const [features, setFeatures] = useState<useExtractFeaturesResponse>()
  const hasRunOnce = useRef(false)
  const hasGeneratedImage = useRef(false)

  useEffect(() => {
    if (hasRunOnce.current) return
    hasRunOnce.current = true
    Promise.all(
      spectras.map(async (src, idx) => {
        console.log(idx, src)
        const boundingBoxes = await separateParts(src, determineBBFunction)
        const bblist = [boundingBoxes.science, boundingBoxes.lamp1, boundingBoxes.lamp2]
        const parts = await cropImages(src, bblist)
        setPartSrcs({
          science: parts[0],
          lamp1: parts[1],
          lamp2: parts[2],
        })
        extractFeatures(
          setFeatures,
          countCheckpoints,
          segmentWidth,
          parts[0],
          parts[1],
          parts[2],
          useSpline,
          reuseScienceFunction,
        )
        //const images = await Promise.all(parts.map(loadImage))
        //const resizeds = await Promise.all(images.map(img=>resize(img, width)))
        //combineAndDownload(resizeds)
        return boundingBoxes
      }),
    ).then((arr) => {
      console.log("Todo Listo", arr)
      return arr
    })
  }, [determineBBFunction])

  useEffect(() => {
    if (features) {
      if (hasGeneratedImage.current) return
      hasGeneratedImage.current = true
      generateImageFromComponentAndDownload(partSrcs!, features!)
    }
  }, [features, partSrcs])
}

/**
 * Procesa una unica imagen de espectro separando sus componentes
 * @returns {science:BoundingBox, lamp1:BoundingBox, lamp2:BoundingBox}
 */
async function separateParts(
  src: string,
  determineBBFunction: (img_src: string) => Promise<BoundingBox[]>,
): Promise<{
  science: BoundingBox
  lamp1: BoundingBox
  lamp2: BoundingBox
}> {
  const boundingBoxes = await determineBBFunction(src)
  console.log("dentro", boundingBoxes)
  const scienceBb = boundingBoxes.filter((bb) => bb.class_info === BBClasses.Science)[0]
  const lampsBbs = boundingBoxes.filter((bb) => bb.class_info === BBClasses.Lamp)
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
  const width = Math.max(...images.map((img) => img.width))
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

function resize(img: HTMLImageElement, w: number): Promise<HTMLImageElement> {
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

export async function generateImageFromComponentAndDownload(
  urls: {
    science: string
    lamp1: string
    lamp2: string
  },
  props: useExtractFeaturesResponse,
): Promise<string> {
  return new Promise((resolve) => {
    // 1. Crear contenedor offscreen
    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.top = "-9999px"
    container.style.left = "-9999px"
    container.style.width = "800px"
    document.body.appendChild(container)

    // 2. Renderizar el componente en ese contenedor
    const root = createRoot(container)
    root.render(
      <div className="flex flex-col gap-4">
        <ImageWithPixelExtraction
          title="Science Spectrum"
          imageUrl={urls.science}
          imageAlt="Pixel-by-pixel analysis of science spectrum to extract spectrum function."
          pointsWMed={props.scienceMediasPoints}
          drawFunction={props.scienceFunction!}
          perpendicularFunctions={props.scienceTransversalFunctions}
          opening={props.scienceAvgOpening}
        >
          <SimpleFunctionXY data={props.scienceTransversalAvgs} />
        </ImageWithPixelExtraction>

        <ImageWithPixelExtraction
          title="Lamp 1 Spectrum"
          imageUrl={urls.lamp1}
          imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 1."
          pointsWMed={props.lamp1MediasPoints}
          drawFunction={props.lamp1Function!}
          perpendicularFunctions={props.lamp1TransversalFunctions}
          opening={props.lamp1AvgOpening}
        >
          <SimpleFunctionXY data={props.lamp1TransversalAvgs} />
        </ImageWithPixelExtraction>

        <ImageWithPixelExtraction
          title="Lamp 2 Spectrum"
          imageUrl={urls.lamp2}
          imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 2."
          pointsWMed={props.lamp2MediasPoints}
          drawFunction={props.lamp2Function!}
          perpendicularFunctions={props.lamp2TransversalFunctions}
          opening={props.lamp2AvgOpening}
        >
          <SimpleFunctionXY data={props.lamp2TransversalAvgs} />
        </ImageWithPixelExtraction>
      </div>,
    )

    // 3. Esperar a que se renderice y capturar
    setTimeout(() => {
      html2canvas(container).then(async (canvas) => {
        // 1. Convertir canvas a imagen
        const image = new Image()
        image.src = canvas.toDataURL("image/png")
        image.crossOrigin = "anonymous"

        // 2. Esperar que cargue
        image.onload = async () => {
          // 3. Redimensionar a 600px de ancho
          const resizedImage = await resize(image, 720)

          // 4. Descargar la imagen redimensionada
          const a = document.createElement("a")
          a.href = resizedImage.src
          a.download = "combined-spectrum-resized.png"
          a.click()

          // 5. Limpiar
          document.body.removeChild(container)
        }
      })
    }, 3000) // esperar un poco para que el render termine (ajustá si hace falta)
  })
}
