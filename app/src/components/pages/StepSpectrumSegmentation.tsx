import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { StepProps } from "@/interfaces/StepProps"
import { classesSpectrumPartSegmentation } from "@/enums/BBClasses"
import { useGlobalStore } from "@/hooks/use-global-store"
import { usePredictBBs } from "@/hooks/use-predict-BBs"
import { cropImages } from "@/lib/cropImage"
import { useEffect, useState } from "react"
import { SegmentationUI } from "../organisms/SegmentationUI"

export function StepSpectrumSegmentation({ index, processInfo, setProcessInfo }: StepProps) {
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum!,
  ])

  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    (processInfo.data.spectrums[selectedSpectrum].partsBoundingBoxes.lamp1 !== null)
      ? [
          processInfo.data.spectrums[selectedSpectrum].partsBoundingBoxes.lamp1!,
          processInfo.data.spectrums[selectedSpectrum].partsBoundingBoxes.lamp2!,
          processInfo.data.spectrums[selectedSpectrum].partsBoundingBoxes.science!,
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
  }, [processInfo.data.plate.scanImage, processInfo.data.spectrums[selectedSpectrum].spectrumBoundingBox])

  function saveBoundingBoxes(boundingBoxes: BoundingBox[]) {
    setProcessInfo(prev => ({
      ...prev,
      data: {
        ...prev.data,
        spectrums: prev.data.spectrums.map((spectrum, index) => (
          index === selectedSpectrum
            ? {
                ...spectrum,
                partsBoundingBoxes: {
                  ...spectrum.partsBoundingBoxes,
                  lamp1: boundingBoxes[0],
                  lamp2: boundingBoxes[1],
                  science: boundingBoxes[2],
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
        <SegmentationUI
          file={spectrumImage}
          onComplete={onComplete}
          enableAutodetect
          boundingBoxes={boundingBoxes}
          setBoundingBoxes={setBoundingBoxes}
          saveBoundingBoxes={saveBoundingBoxes} // funcion de guardado personalizada para los bounding boxes
          determineBBFunction={determineBBFunction}
          classes={classesSpectrumPartSegmentation}
        />
      )}
    </div>
  )
}
