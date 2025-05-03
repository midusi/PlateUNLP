import type { BoundingBox } from "@/interfaces/BoundingBox"

/**
 * Dada una imagen y una bounding box genera el base64 de la seccion de la
 * imagen correspondiente al bounding box.
 * @param {HTMLImageElement} image - Imagen completa.
 * @param {BoundingBox} box - Bounding Box.
 * @returns {string} -
 * Base64 del recorte de la imagen.
 */
function trimImageToBase64(
  image: HTMLImageElement,
  box: BoundingBox,
): string {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  const realX = box.x
  const realY = box.y
  const realWidth = box.width
  const realHeight = box.height

  canvas.width = realWidth
  canvas.height = realHeight

  ctx!.drawImage(
    image,
    realX, // Coordenada X en la imagen real
    realY, // Coordenada Y en la imagen real
    realWidth, // Ancho real de la bounding box
    realHeight, // Alto real de la bounding box
    0, // Pocicion X donde se empezara a dibujar la imagen
    0, // Pocicion Y donde se empezara a dibujar la imagen
    realWidth, // Ancho con el que se dibujara el recorte.
    realHeight, // Alto con el que se dibujara el recorte.
  )

  return canvas.toDataURL("image/png")
}

/**
 * Dada una imagen y un conjunto de bounding boxes retorna el listado de recortes
 * de imagen que corresponden.
 * @param {string} file - Archivo (base64) de la imagen a recortar
 * @param {BoundingBox[]} boundingBoxes - Listado de recortes a realizar en la imagen.
 * @returns {Promise<string[]>} -
 * Promesa de arreglos de recortes (base64).
 */
export async function cropImages(file: string, boundingBoxes: BoundingBox[]): Promise<string[]> {
  if (!file || boundingBoxes.length === 0)
    return []

  const croppedImages: string[] = []

  // Cargar imagen
  const image = new Image()
  image.src = file
  await new Promise((resolve) => {
    image.onload = resolve
  })

  boundingBoxes.forEach((box) => {
    croppedImages.push(trimImageToBase64(image, box))
  })

  return croppedImages
}
