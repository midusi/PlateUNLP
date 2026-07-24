/**
 * Loads an image from a given source URL as a Promise.
 * @param src - Image source URL.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = (reason) => reject(reason)
    image.src = src
  })
}
