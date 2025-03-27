import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { StepProps } from "@/interfaces/StepProps"
import { classesSpectrumPartSegmentation } from "@/enums/BBClasses"
import { useGlobalStore } from "@/hooks/use-global-store"
import { usePredictBBs } from "@/hooks/use-predict-BBs"
import { useState } from "react"
import { LoadFile } from "../molecules/LoadFile"
import { SegmentationUI } from "../organisms/SegmentationUI"

export function StepSpectrumSegmentation({ index, processInfo, setProcessInfo }: StepProps) {
  const [file, setFile] = useState<string | null>(null)
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([])
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum,
  ])
  const determineBBFunction = usePredictBBs(
    1088,
    "spectrum_part_segmentator.onnx",
    classesSpectrumPartSegmentation,
    true,
  )

  function saveCroppedImages(croppedImages: string[]) {
    setProcessInfo(prev => ({
      ...prev,
      spectrums: prev.spectrums.map((spectrum, index) => (
        index === selectedSpectrum
          ? {
              ...spectrum,
              images: {
                lamps: croppedImages,
                scienceSpectrum: croppedImages[0],
              }, // FALTA: DISTINGUIR ENTRE LAMPARA Y ESPECTRO DE CIENCIA, AHORA SOLO LO ASIGNO AL AZAR.
            }
          : spectrum
      )),
    }))
  }

  function onComplete() {
    /// AGREGAR GUARDADO DE RECORTES DE IMAGENES

    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    const generalTotal = processInfo.general.length
    setProcessInfo(prev => ({
      ...prev,
      perSpectrum: prev.perSpectrum.map((step, i) => (
        (i === (index - generalTotal)) // La etapa actual de selectedSpectrum se marca como completado
          ? {
              ...step,
              states: step.states!.map((state, j) => (
                j === selectedSpectrum
                  ? "COMPLETE" as const
                  : state
              )),
            }
          : ((i === (index - generalTotal + 1))// Si hay otra etapa adelante se la marca como que necesita cambios
              ? {
                  ...step,
                  states: step.states!.map((state, j) => (
                    j === selectedSpectrum
                      ? "NECESSARY_CHANGES" as const
                      : state
                  )),
                }
              : step // Cualquier otra etapa mantiene su informacion
            )
      )),
    }))
    setActualStep(index + 1)
  }

  return (
    <div className="w-full p-6">
      {!file && <LoadFile onSelect={(fileValue: string) => setFile(fileValue)} />}
      {file && (
        <SegmentationUI
          file={file}
          onComplete={onComplete}
          enableAutodetect
          boundingBoxes={boundingBoxes}
          setBoundingBoxes={setBoundingBoxes}
          saveCroppedImages={saveCroppedImages} // no pasar funcion de estado sino funcion de guardado personalizada
          determineBBFunction={determineBBFunction}
          classes={classesSpectrumPartSegmentation}
        />
      )}
    </div>
  )
}
