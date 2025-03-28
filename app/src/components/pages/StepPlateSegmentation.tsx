import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { StepProps } from "@/interfaces/StepProps"
import { classesSpectrumDetection } from "@/enums/BBClasses"
import { useGlobalStore } from "@/hooks/use-global-store"
import { usePredictBBs } from "@/hooks/use-predict-BBs"
import { useState } from "react"
import { LoadFile } from "../molecules/LoadFile"
import { SegmentationUI } from "../organisms/SegmentationUI"

export function StepPlateSegmentation({ index, setProcessInfo }: StepProps) {
  const [file, setFile] = useState<string | null>(null)
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([])
  const [setActualStep] = useGlobalStore(s => [
    s.setActualStep,
  ])
  const determineBBFunction = usePredictBBs(
    1024,
    "spectrum_detector.onnx",
    classesSpectrumDetection,
    false,
    0.65
  )

  function saveCroppedImages(croppedImages: string[]) {
    setProcessInfo(prev => ({
      ...prev,
      spectrums: croppedImages.map((image, index) => ({
        id: index,
        name: `Plate${index}#Spectrum`,
        image,
        images: {
          lamps: [],
          scienceSpectrum: "",
        },
      })),
    }))
  }

  function onComplete() {
    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    setProcessInfo(prev => ({
      ...prev,
      general: prev.general.map((step, i) => ({
        ...step,
        state: index === i
          ? "COMPLETE"
          : (index + 1 === i
              ? "NECESSARY_CHANGES"
              : step.state),
      })),
      perSpectrum: prev.perSpectrum.map((step, i) => (
        {
          ...step,
          states: boundingBoxes.map(_ => (
            i === 0
              ? "NECESSARY_CHANGES" as const
              : "NOT_REACHED" as const
          )),
        }

      )),
    }))
    setActualStep(index + 1)
  }

  return (
    <>
      <div className="w-full p-6">
        {!file && <LoadFile onSelect={(fileValue: string) => setFile(fileValue)} />}
        {file && (
          <SegmentationUI
            file={file}
            onComplete={onComplete}
            enableAutodetect
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            saveCroppedImages={saveCroppedImages}
            determineBBFunction={determineBBFunction}
            classes={classesSpectrumDetection}
          />
        )}
      </div>
    </>
  )
}
