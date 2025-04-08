
export async function align(imageb64: string): Promise<string> {

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
    if (naturalHeight > naturalWidth) {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');

        canvas.width = naturalHeight
        canvas.height = naturalWidth

        ctx.translate(naturalHeight, 0)
        ctx.rotate(Math.PI / 2) // 90º

        ctx.drawImage(image, 0, 0)

        imageProcessed = canvas.toDataURL();
    }

    return imageProcessed
}

export function ensureWhite(imageb64: string): string {

    return imageb64
}