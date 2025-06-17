import { useState } from "react"
import { classesSpectrumDetection } from "@/enums/BBClasses"
import { useGlobalStore } from "@/hooks/use-global-store"
import { usePredictBBs } from "@/hooks/use-predict-BBs"
import { Button } from "../atoms/button"
import type { BoxMetadata } from "../molecules/BoxMetadataForm"
import { StepProps } from "@/interfaces/StepProps"
import { BoundingBox } from "@/interfaces/BoundingBox"
import { BoundingBoxer } from "../molecules/BoundingBoxer"
import { BoxList, Step } from "../organisms/BBList"
import { BoxList2 } from "../organisms/BBList2"

export function StepPlateSegmentation({
  index,
  processInfo,
  setProcessInfo,
}: StepProps) {
  const [setActualStep] = useGlobalStore((s) => [s.setActualStep])
  const determineBBFunction = usePredictBBs(
    1024,
    "spectrum_detector.onnx",
    classesSpectrumDetection,
    false,
    0.7,
  )

  /** Cajas delimitadoras de cada observación */
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
    processInfo.data.spectrums.map(spec => spec.spectrumBoundingBox),
  )
  /** Metadatos de cada observacion */
  const [observationsMetadata, setObservationsMetadata] = useState<BoxMetadata[]>(
    processInfo.data.spectrums.map(spec => spec.metadata!)
  )
  /** Observacion seleccionada */
  const [observationSelected, setObservationSelected] = useState<string | null>(null)

  /** Imagen de escaneo seleccionada */
  const [imageSelected, setImageSelected] = useState<string|null>(
    processInfo.data.plate.scanImage
  )

  /** Almacena información de imagen de la placa en ProcessInfo */ 
  function saveImage(src: string) {
    setImageSelected(src)
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

  /** Almacena BB que delimitan cada observación en processInfo */
  function saveBoundingBoxes(
    boundingBoxes: BoundingBox[]
  ) {
    setProcessInfo((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        spectrums: boundingBoxes.map((bb, index) => ({
          id: index,
          name: `Plate${index}#Spectrum`,
          spectrumBoundingBox: bb,
          metadata: null,
          parts: {
            lamp1: { boundingBox: null, extractedSpectrum: null },
            lamp2: { boundingBox: null, extractedSpectrum: null },
            science: { boundingBox: null, extractedSpectrum: null },
          },
        })),
      },
    }))
  }

  /** Almacena metadatos de cada observación en processInfo */
  function saveObservationsMetadata (
    observationsMetadata: BoxMetadata[],
  ) {
    setProcessInfo((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        spectrums: prev.data.spectrums.map((spectrum, index) => ({
          ...spectrum,
          metadata: observationsMetadata[index],
        })),
      },
    }))
  }

  /** 
   * Marca el paso actual como completado y el que le sigue 
   * como que necesita actualizaciones 
   */
  function onComplete() {
    setProcessInfo((prev) => ({
      ...prev,
      processingStatus: {
        ...prev.processingStatus,
        generalSteps: prev.processingStatus.generalSteps.map((step, i) => ({
          ...step,
          state:
            index === i
              ? "COMPLETE"
              : index + 1 === i
                ? "NECESSARY_CHANGES"
                : step.state,
        })),
        specificSteps: prev.processingStatus.specificSteps.map((step, i) => ({
          ...step,
          states: boundingBoxes.map((_) =>
            i === 0 ? ("NECESSARY_CHANGES" as const) : ("NOT_REACHED" as const),
          ),
        })),
      },
    }))
    setActualStep(index + 1)
  }

  /** Maneja el click del boton save */
  function handleSave(){
    saveBoundingBoxes(boundingBoxes)
    saveObservationsMetadata(
      boundingBoxes.map(() => ({
        "OBJECT": null,
        "DATE_OBS": null,
        "UT": null
      }))
    )
    onComplete()
  }

  return (
    <div className="flex flex-col w-full">
      <BoundingBoxer
        file={imageSelected ?? undefined}
        setFile={!imageSelected ? saveImage : undefined}
        boundingBoxes={boundingBoxes}
        setBoundingBoxes={setBoundingBoxes}
        boundingBoxSelected={observationSelected}
        setBoundingBoxSelected={setObservationSelected}
        detectBBFunction={determineBBFunction}
        classes={classesSpectrumDetection}
      />
      <BoxList2 
        boundingBoxes={boundingBoxes}
        setBoundingBoxes={setBoundingBoxes}
        boxMetadatas = {observationsMetadata}
        setBoxMetadatas = {setObservationsMetadata}
        selected = {observationSelected}
        setSelected = {setObservationSelected}
        classes = {classesSpectrumDetection}
        parameters = {{step: Step.Plate}}
      >
        <span>Parte variable</span>
      </BoxList2>
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
}
