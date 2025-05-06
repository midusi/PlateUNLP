import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { StepProps } from "@/interfaces/StepProps"
import { BBClasses, classesSpectrumPartSegmentation } from "@/enums/BBClasses"
import { useGlobalStore } from "@/hooks/use-global-store"
import { usePredictBBs } from "@/hooks/use-predict-BBs"
import { cropImages } from "@/lib/cropImage"
import { useEffect, useState } from "react"
import { BBUI } from "../organisms/BBUI"
import { Step } from "../organisms/BBList"

export function StepSpectrumSegmentation({ index, processInfo, setProcessInfo }: StepProps) {
  const parameters = {
    rotateButton: false,
    invertColorButton: false,
    step: Step.Spectrum,
  }
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum!,
  ])

  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    (processInfo.data.spectrums[selectedSpectrum].parts.lamp1.boundingBox !== null)
      ? [
        processInfo.data.spectrums[selectedSpectrum].parts.lamp1.boundingBox!,
        processInfo.data.spectrums[selectedSpectrum].parts.lamp2.boundingBox!,
        processInfo.data.spectrums[selectedSpectrum].parts.science.boundingBox!,
      ]
      : [],
  )

  const determineBBFunction = usePredictBBs(
    1088,
    "spectrum_part_segmentator.onnx",
    classesSpectrumPartSegmentation,
    true,
  )

  const [spectrumImage, setSpectrumImage] = useState<string | null>(null)
  useEffect(() => {
    cropImages(
      processInfo.data.plate.scanImage!,
      [processInfo.data.spectrums[selectedSpectrum].spectrumBoundingBox],
    ).then((images) => { setSpectrumImage(images[0]) })
  }, [processInfo.data.plate.scanImage, processInfo.data.spectrums, selectedSpectrum])

  function saveBoundingBoxes(boundingBoxes: BoundingBox[]) {
    const scienceBb = boundingBoxes.filter(bb => bb.class_info === BBClasses.Science)[0]
    const lampsBbs = boundingBoxes.filter(bb => bb.class_info === BBClasses.Lamp)
    setProcessInfo(prev => ({
      ...prev,
      data: {
        ...prev.data,
        spectrums: prev.data.spectrums.map((spectrum, index) => (
          index === selectedSpectrum
            ? {
              ...spectrum,
              parts: {
                ...spectrum.parts,
                lamp1: {
                  ...spectrum.parts.lamp1,
                  boundingBox: lampsBbs[0],
                },
                lamp2: {
                  ...spectrum.parts.lamp2,
                  boundingBox: lampsBbs[1],
                },
                science: {
                  ...spectrum.parts.science,
                  boundingBox: scienceBb,
                },
              },
            }
            : spectrum
        )),
      },
    }))
  }

  function onComplete() {
    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    const generalTotal = processInfo.processingStatus.generalSteps.length
    setProcessInfo(prev => ({
      ...prev,
      processingStatus: {
        ...prev.processingStatus,
        specificSteps: prev.processingStatus.specificSteps.map((step, i) => (
          (i === (index - generalTotal)) // La etapa actual de selectedSpectrum se marca como completado
            ? {
              ...step,
              states: step.states!.map((state, j) => (
                j === selectedSpectrum
                  ? "COMPLETE" as const
                  : state
              )),
            }
            : ((i === (index - generalTotal + 1)) // Si hay otra etapa adelante se la marca como que necesita cambios
              ? {
                ...step,
                states: step.states!.map((state, j) => (
                  j === selectedSpectrum
                    ? "NECESSARY_CHANGES" as const
                    : state
                )),
              }
              : step // Cualquier otra etapa mantiene su informacion
            )),
        ),
      },
    }))
    setActualStep(index + 1)
  }

  return (
    <div className="w-full p-6">
      {spectrumImage && (
        <BBUI
          file={spectrumImage}
          boundingBoxes={boundingBoxes}
          setBoundingBoxes={setBoundingBoxes}
          onComplete={onComplete}
          saveBoundingBoxes={saveBoundingBoxes}
          classes={classesSpectrumPartSegmentation}
          determineBBFunction={determineBBFunction}
          parameters={parameters}
        />
      )}
    </div>
  )
}
