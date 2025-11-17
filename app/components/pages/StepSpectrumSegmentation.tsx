import { useEffect, useState } from "react"
import { useGlobalStore } from "~/hooks/use-global-store"
import { usePredictBBs } from "~/hooks/use-predict-BBs"
import { cropImages } from "~/lib/cropImage"
import { BBClasses, classesSpectrumPartSegmentation } from "~/types/BBClasses"
import type { BoundingBox } from "~/types/BoundingBox"
import type { StepProps } from "~/types/StepProps"
import { Button } from "../atoms/button"
import { BoundingBoxer } from "../molecules/BoundingBoxer"
import { BoxList } from "../organisms/BBList"

export function StepSpectrumSegmentation({ index, processInfo, setProcessInfo }: StepProps) {
  const [setActualStep, selectedSpectrum] = useGlobalStore((s) => [
    s.setActualStep,
    s.selectedSpectrum!,
  ])
  const determineBBFunction = usePredictBBs(
    1088,
    "spectrum_part_segmentator.onnx",
    classesSpectrumPartSegmentation,
    true,
  )

  /** Cajas delimitadoras de cada observación */
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    processInfo.data.spectrums[selectedSpectrum].parts.lamp1.boundingBox !== null
      ? [
          processInfo.data.spectrums[selectedSpectrum].parts.lamp1.boundingBox!,
          processInfo.data.spectrums[selectedSpectrum].parts.lamp2.boundingBox!,
          processInfo.data.spectrums[selectedSpectrum].parts.science.boundingBox!,
        ]
      : [],
  )

  /** caja delimitadora seleccionada */
  const [bbSelected, setBBSelected] = useState<string | null>(null)

  /** Imagen de espectro seleccionada */
  const [imageSelected, setImageSelected] = useState<string | null>(null)
  useEffect(() => {
    cropImages(processInfo.data.plate.scanImage!, [
      processInfo.data.spectrums[selectedSpectrum].spectrumBoundingBox,
    ]).then((images) => {
      setImageSelected(images[0])
    })
  }, [processInfo.data.plate.scanImage, processInfo.data.spectrums, selectedSpectrum])

  /** Almacena BB que delimitan cada espectro en processInfo */
  function saveBoundingBoxes(boundingBoxes: BoundingBox[]) {
    const scienceBb = boundingBoxes.filter((bb) => bb.class_info === BBClasses.Science)[0]
    const lampsBbs = boundingBoxes.filter((bb) => bb.class_info === BBClasses.Lamp)
    setProcessInfo((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        spectrums: prev.data.spectrums.map((spectrum, index) =>
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
            : spectrum,
        ),
      },
    }))
  }

  /**
   * Marca el paso actual como completado y el que le sigue
   * como que necesita actualizaciones
   */
  function onComplete() {
    const generalTotal = processInfo.processingStatus.generalSteps.length
    setProcessInfo((prev) => ({
      ...prev,
      processingStatus: {
        ...prev.processingStatus,
        specificSteps: prev.processingStatus.specificSteps.map(
          (step, i) =>
            i === index - generalTotal // La etapa actual de selectedSpectrum se marca como completado
              ? {
                  ...step,
                  states: step.states!.map((state, j) =>
                    j === selectedSpectrum ? ("COMPLETE" as const) : state,
                  ),
                }
              : i === index - generalTotal + 1 // Si hay otra etapa adelante se la marca como que necesita cambios
                ? {
                    ...step,
                    states: step.states!.map((state, j) =>
                      j === selectedSpectrum ? ("NECESSARY_CHANGES" as const) : state,
                    ),
                  }
                : step, // Cualquier otra etapa mantiene su informacion
        ),
      },
    }))
    setActualStep(index + 1)
  }

  /** Maneja el click del boton save */
  function handleSave() {
    saveBoundingBoxes(boundingBoxes)
    onComplete()
  }

  return (
    imageSelected && (
      <div className="flex flex-col w-full">
        <BoundingBoxer
          file={imageSelected}
          boundingBoxes={boundingBoxes}
          setBoundingBoxes={setBoundingBoxes}
          boundingBoxSelected={bbSelected}
          setBoundingBoxSelected={setBBSelected}
          detectBBFunction={determineBBFunction}
          classes={classesSpectrumPartSegmentation}
        />
        <BoxList
          boundingBoxes={boundingBoxes}
          setBoundingBoxes={setBoundingBoxes}
          selected={bbSelected}
          setSelected={setBBSelected}
          classes={classesSpectrumPartSegmentation}
        />
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => handleSave()}
            disabled={imageSelected === null || boundingBoxes.length === 0}
          >
            Save
          </Button>
        </div>
      </div>
    )
  )
}
