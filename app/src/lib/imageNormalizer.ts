
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

export async function ensureWhite(imageb64: string): Promise<string> {

    const image = new Image()
    image.src = imageb64
    await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
    })

    // Detectar color fondo (Blanco | Negro)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');

    ctx.drawImage(image, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    let brightnessSum = 0

    // Fórmula de luminancia (luma)
    const getBrightness = (r: number, g: number, b: number) =>
        0.299 * r + 0.587 * g + 0.114 * b;

    const width = canvas.width;
    const height = canvas.height;

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

    if (avgBrightness < 128) {
        console.log("Fondo Negro")
    } else {
        console.log("Fondo Blanco")
    }

    return imageb64
}