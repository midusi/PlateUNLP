import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { StepProps } from "@/interfaces/StepProps"
import { classesSpectrumDetection } from "@/enums/BBClasses"
import { useGlobalStore } from "@/hooks/use-global-store"
import { usePredictBBs } from "@/hooks/use-predict-BBs"
import { useState } from "react"
import { Button } from "../atoms/button"
import { LoadFile } from "../molecules/LoadFile"
import { BBUI } from "../organisms/BBUI"
import { SegmentationUI } from "../organisms/SegmentationUI"

export function StepPlateSegmentation({ index, processInfo, setProcessInfo }: StepProps) {
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
          partsBoundingBoxes: {
            lamp1: null,
            lamp2: null,
            science: null,
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
        boundingBoxes={boundingBoxes}
        setBoundingBoxes={setBoundingBoxes}
        onComplete={onComplete}
        saveBoundingBoxes={saveBoundingBoxes}
        saveImageLoading={saveImage}
      />
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => {
            saveBoundingBoxes(boundingBoxes)
            onComplete()
          }}
          disabled={processInfo.data.plate.scanImage === null || boundingBoxes.length === 0}
        >
          Save
        </Button>
      </div>
      <div className="w-full p-6">
        {!processInfo.data.plate.scanImage && (
          <LoadFile onSelect={(fileValue: string) => {
            // Si no hay archivo de escaneo cargado etonces solicita uno al usuario.
            // Lo guarda en processInfo.data.plate.scanImage
            setProcessInfo(prev => ({
              ...prev,
              data: {
                ...prev.data,
                plate: {
                  ...prev.data.plate,
                  scanImage: fileValue,
                },
              },
            }))
          }}
          />
        )}
        {processInfo.data.plate.scanImage && (
          <SegmentationUI
            file={processInfo.data.plate.scanImage}
            onComplete={onComplete}
            enableAutodetect
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            saveBoundingBoxes={saveBoundingBoxes}
            determineBBFunction={determineBBFunction}
            classes={classesSpectrumDetection}
          />
        )}
      </div>
    </div>
  )
}
