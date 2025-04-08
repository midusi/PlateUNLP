import type { BBClassesProps } from "@/enums/BBClasses"
import type { BoundingBox } from "@/interfaces/BoundingBox"
import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { Button } from "@/components/atoms/button"
import { BBImageEditor } from "@/components/organisms/BBImageEditor"
import { align, ensureWhite } from "@/lib/imageNormalizer"

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

  useEffect(() => {
    const processImage = async () => {
      const aligned = await align(file)
      const ensuredWhite = await ensureWhite(aligned)
      setFileNormalized(ensuredWhite)
    }

    processImage()
  }, [file])

  if (!fileNormalized) {
    return <div>Loading Image...</div>
  }

  return (
    <>
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
