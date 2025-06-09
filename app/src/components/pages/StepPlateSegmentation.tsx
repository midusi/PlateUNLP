import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { StepProps } from "@/interfaces/StepProps"
import { classesSpectrumDetection } from "@/enums/BBClasses"
import { useGlobalStore } from "@/hooks/use-global-store"
import { usePredictBBs } from "@/hooks/use-predict-BBs"
import { useImperativeHandle, useRef, useState } from "react"
import { BBUI } from "../organisms/BBUI"
import { Step } from "../organisms/BBList"
import { BoxMetadata, BoxMetadataNulls } from "../molecules/BoxMetadataForm"

export function StepPlateSegmentation({ index, processInfo, setProcessInfo }: StepProps) {
  const parameters = {
    rotateButton: true,
    invertColorButton: true,
    step: Step.Plate,
  }
  const bBUIRef = useRef<{ showErrors: () => Promise<void> }>(null)

  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    processInfo.data.spectrums.map(spec => spec.spectrumBoundingBox),
  )
  const [boxMetadatas, setBoxMetadatas] = useState<BoxMetadata[]>(
    processInfo.data.spectrums.map(spec => spec.metadata),
  )
  const [boxMetadataNulls, setBoxMetadataNulls] = useState<BoxMetadataNulls[]>(
    processInfo.data.spectrums.map(spec => spec.metadataNulls),
  )
  const [setActualStep] = useGlobalStore(s => [
    s.setActualStep,
  ])
  const [validForms, setValidForms] = useState<boolean>(false)
  const determineBBFunction = usePredictBBs(
    1024,
    "spectrum_detector.onnx",
    classesSpectrumDetection,
    false,
    0.70,
  )

  function saveBoundingBoxes(boundingBoxes: BoundingBox[], boxMetadata: BoxMetadata[], nulls: BoxMetadataNulls[]) {
    setProcessInfo(prev => ({
      ...prev,
      data: {
        ...prev.data,
        spectrums: boundingBoxes.map((bb, index) => ({
          id: index,
          name: `Plate${index}#Spectrum`,
          spectrumBoundingBox: bb,
          metadata: boxMetadata[index],
          metadataNulls: nulls[index],
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

  const onComplete = async () => {
    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    if (validForms) {
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
    else {
      await bBUIRef.current?.showErrors()
    }
  }

  return (
    <div className="flex flex-col w-full">
      <BBUI
        ref={bBUIRef}
        file={processInfo.data.plate.scanImage}
        boundingBoxes={boundingBoxes}
        setBoundingBoxes={setBoundingBoxes}
        boxMetadatas={boxMetadatas}
        setBoxMetadatas={setBoxMetadatas}
        boxMetadataNulls={boxMetadataNulls}
        setBoxMetadataNulls={setBoxMetadataNulls}
        setValidForms={setValidForms}
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
