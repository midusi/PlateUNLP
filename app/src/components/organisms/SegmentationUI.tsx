import type { BBClassesProps } from "@/enums/BBClasses"
import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/atoms/button"
import { BBImageEditor } from "@/components/organisms/BBImageEditor"
import { align, bgColor, ensureWhite, rotate } from "@/lib/imageNormalizer"
import clsx from "clsx"
import { Palette, RotateCw } from "lucide-react"
import { useEffect, useState } from "react"

interface SegmentationUIProps {
  file: string
  onComplete: () => void
  enableAutodetect: boolean
  boundingBoxes: BoundingBox[]
  setBoundingBoxes: Dispatch<SetStateAction<BoundingBox[]>>
  saveBoundingBoxes: (boundingBoxes: BoundingBox[]) => void
  determineBBFunction: (img_src: string) => Promise<BoundingBox[]>
  classes: BBClassesProps[]
}

export function SegmentationUI({
  file,
  onComplete,
  enableAutodetect,
  boundingBoxes,
  setBoundingBoxes,
  saveBoundingBoxes,
  determineBBFunction,
  classes,
}: SegmentationUIProps) {
  const [fileNormalized, setFileNormalized] = useState<string | null>(null)
  const [bgWhite, setBgWhite] = useState(false)
  const [rotation, setRotation] = useState(0) // Rotacion medida en grados

  useEffect(() => {
    const processImage = async () => {
      const aligned = await align(file)
      setRotation(aligned.degrees)
      // const ensuredWhite = await ensureWhite(aligned.image, "white")
      const imgBgColor = await bgColor(aligned.image)
      setBgWhite(imgBgColor === "white")
      setFileNormalized(aligned.image)
    }

    processImage()
  }, [file])

  if (!fileNormalized) {
    return <div>Loading Image...</div>
  }

  async function handleInvert() {
    const ensuredWhite = await ensureWhite(
      fileNormalized!,
      bgWhite ? "black" : "white",
    )
    setFileNormalized(ensuredWhite.image)
    setBgWhite(ensuredWhite.bgColor === "white")
  }

  async function handleRotate() {
    const aligned = await rotate(fileNormalized!, 90)
    setFileNormalized(aligned)
    setRotation((rotation + 90) % 360)
  }

  return (
    <>
      <div className="bg-slate-100 p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Tools</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => { handleRotate() }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-black bg-white hover:bg-slate-50"
            >
              <RotateCw className="h-4 w-4" />
              <span>
                {`Rotate 90º from ${rotation}º`}
              </span>
            </Button>
            <Button
              onClick={() => { handleInvert() }}
              variant="outline"
              size="sm"
              className={clsx(
                "flex items-center gap-2",
                bgWhite
                  ? "bg-white text-black hover:bg-slate-50"
                  : "bg-slate-800 text-white hover:bg-slate-700",
              )}
            >
              <Palette className="h-4 w-4" />
              <span>Invert colors</span>
            </Button>
          </div>
        </div>
      </div>
      <BBImageEditor
        className="w-full"
        src={fileNormalized}
        boundingBoxes={boundingBoxes}
        setBoundingBoxes={setBoundingBoxes}
        enableAutodetect={enableAutodetect}
        determineBB={determineBBFunction}
        classes={classes}
      />
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => {
            saveBoundingBoxes(boundingBoxes)
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
