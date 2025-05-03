import type { BoundingBox } from "@/interfaces/BoundingBox"

function trimImageToBase64(
  image: HTMLImageElement,
  box: BoundingBox,
  scale: { x: number, y: number },
): string {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  const realX = box.x * scale.x
  const realY = box.y * scale.y
  const realWidth = box.width * scale.x
  const realHeight = box.height * scale.y

  canvas.width = realWidth
  canvas.height = realHeight

  ctx!.drawImage(
    image,
    realX, // Coordenada X en la imagen real
    realY, // Coordenada Y en la imagen real
    realWidth, // Ancho real de la bounding box
    realHeight, // Alto real de la bounding box
    0,
    0,
    realWidth,
    realHeight,
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

  // Informacion de escala
  const { naturalWidth, naturalHeight, width, height } = image
  const scaleX = naturalWidth / width
  const scaleY = naturalHeight / height

  boundingBoxes.forEach((box) => {
    croppedImages.push(trimImageToBase64(image, box, { x: scaleX, y: scaleY }))
  })

  return croppedImages
}
