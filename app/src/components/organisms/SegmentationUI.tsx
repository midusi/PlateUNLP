import type { BBClassesProps } from "@/enums/BBClasses"
import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/atoms/button"
import { BBImageEditor } from "@/components/organisms/BBImageEditor"

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
  return (
    <>
      <BBImageEditor
        className="w-full"
        src={file}
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
