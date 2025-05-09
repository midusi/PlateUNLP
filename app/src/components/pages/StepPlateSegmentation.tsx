import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { StepProps } from "@/interfaces/StepProps"
import { classesSpectrumDetection } from "@/enums/BBClasses"
import { useGlobalStore } from "@/hooks/use-global-store"
import { usePredictBBs } from "@/hooks/use-predict-BBs"
import { useState } from "react"
import { BBUI } from "../organisms/BBUI"
import { Step } from "../organisms/BBList"

export function StepPlateSegmentation({ index, processInfo, setProcessInfo }: StepProps) {
  const parameters = {
    rotateButton: true,
    invertColorButton: true,
    step: Step.Plate,
  }
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    processInfo.data.spectrums.map(spec => spec.spectrumBoundingBox),
  )
  const [setActualStep] = useGlobalStore(s => [
    s.setActualStep,
  ])
  const determineBBFunction = usePredictBBs(
    1024,
    "spectrum_detector.onnx",
    classesSpectrumDetection,
    false,
    0.70,
  )

  function saveBoundingBoxes(boundingBoxes: BoundingBox[]) {
    setProcessInfo(prev => ({
      ...prev,
      data: {
        ...prev.data,
        spectrums: boundingBoxes.map((bb, index) => ({
          id: index,
          name: `Plate${index}#Spectrum`,
          spectrumBoundingBox: bb,
          parts: {
            lamp1: { boundingBox: null, extractedSpectrum: null },
            lamp2: { boundingBox: null, extractedSpectrum: null },
            science: { boundingBox: null, extractedSpectrum: null },
          },
        })),
      },
    }))
  }

  function saveImage(src: string) {
    setProcessInfo(prev => ({
      ...prev,
      data: {
        ...prev.data,
        plate: {
          ...prev.data.plate,
          scanImage: src,
        },
      },
    }))
  }

  function onComplete() {
    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    setProcessInfo(prev => ({
      ...prev,
      processingStatus: {
        ...prev.processingStatus,
        generalSteps: prev.processingStatus.generalSteps.map((step, i) => ({
          ...step,
          state: index === i
            ? "COMPLETE"
            : (index + 1 === i
              ? "NECESSARY_CHANGES"
              : step.state),
        })),
        specificSteps: prev.processingStatus.specificSteps.map((step, i) => ({
          ...step,
          states: boundingBoxes.map(_ => (
            i === 0
              ? "NECESSARY_CHANGES" as const
              : "NOT_REACHED" as const
          )),
        })),
      },
    }))
    setActualStep(index + 1)
  }

  return (
    <div className="flex flex-col w-full">
      <BBUI
        file={processInfo.data.plate.scanImage}
        boundingBoxes={boundingBoxes}
        setBoundingBoxes={setBoundingBoxes}
        onComplete={onComplete}
        saveBoundingBoxes={saveBoundingBoxes}
        saveImageLoading={saveImage}
        classes={classesSpectrumDetection}
        determineBBFunction={determineBBFunction}
        parameters={parameters}
      />
    </div>
  )
}
