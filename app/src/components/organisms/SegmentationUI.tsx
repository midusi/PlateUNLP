import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/atoms/button"
import { BBImageEditor } from "@/components/organisms/BBImageEditor"
import { usePredictBBs } from "@/hooks/use-predict-BBs"

interface SegmentationUIProps {
  file: string
  onComplete: () => void
  enableAutodetect: boolean
  boundingBoxes: BoundingBox[]
  setBoundingBoxes: Dispatch<SetStateAction<BoundingBox[]>>
  saveCroppedImages: (croppedImages: string[]) => void
  determineBBFunction: (img_src: string) => Promise<BoundingBox[]>
}

export function SegmentationUI({
  file,
  onComplete,
  enableAutodetect,
  boundingBoxes,
  setBoundingBoxes,
  saveCroppedImages,
  determineBBFunction,
}: SegmentationUIProps) {
  async function saveImages() {
    if (!file || boundingBoxes.length === 0)
      return

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

    saveCroppedImages(croppedImages)
  }

  return (
    <>
      <BBImageEditor
        className="w-full"
        src={file}
        boundingBoxes={boundingBoxes}
        setBoundingBoxes={setBoundingBoxes}
        enableAutodetect={enableAutodetect}
        determineBB={determineBBFunction}
      />
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => {
            saveImages()
            onComplete()
          }}
          disabled={file === null || boundingBoxes.length === 0}
        >
          Save
        </Button>
      </div>
    </>
  )
}

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
