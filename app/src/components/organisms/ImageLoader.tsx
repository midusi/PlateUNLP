interface ImageLoaderProps {
  handleImageLoad: (src: string) => void
}

export function ImageLoader({ handleImageLoad }: ImageLoaderProps) {
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        const img = new Image()

        img.onload = () => {
          const canvas = padImageToSquare(img)
          const squaredDataUrl = canvas.toDataURL("image/png")

          handleImageLoad(squaredDataUrl as string)
        }

        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    }
  }
  function padImageToSquare(image: HTMLImageElement): HTMLCanvasElement {
    const maxSide = Math.max(image.width, image.height)
    const canvas = document.createElement("canvas")
    canvas.width = maxSide
    canvas.height = maxSide

    const ctx = canvas.getContext("2d")!

    // Rellenar con blanco
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, maxSide, maxSide)

    const offsetX = (maxSide - image.width) / 2
    const offsetY = 0

    ctx.drawImage(image, offsetX, offsetY)

    return canvas
  }
  // Función para convertir en cuadrado con padding transparente
  /* function padImageToSquare(image: HTMLImageElement): HTMLCanvasElement {
      const maxSide = Math.max(image.width, image.height);
      const canvas = document.createElement("canvas");
      canvas.width = maxSide;
      canvas.height = maxSide;

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, maxSide, maxSide);

      const offsetX = (maxSide - image.width) / 2;
      const offsetY = (maxSide - image.height) / 2;

      ctx.drawImage(image, offsetX, offsetY);

      return canvas;
    }
  */

  return (
    <div className="w-full h-full p-6 rounded-lg">
      <label
        htmlFor="image-upload"
        className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <p className="mb-2 text-sm text-slate-500">
            <span className="font-semibold">Click to upload an image</span>
          </p>
          <p className="text-xs text-slate-500">PNG, JPG or TIFF</p>
        </div>
        <input
          id="image-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </label>
    </div>
  )
}
