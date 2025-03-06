import type { BoundingBox } from "@/interfaces/BoundingBox"

import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
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

  function onComplete() {
    /// AGREGAR GUARDADO DE RECORTES DE IMAGENES

    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    setProcessInfo(prev => ({
      ...prev,
      perSpectrum: prev.perSpectrum.map((step, i) => (
        (i === index) // La etapa actual de selectedSpectrum se marca como completado
          ? {
              ...step,
              states: step.states!.map((state, j) => (
                j === selectedSpectrum
                  ? "COMPLETE" as const
                  : state
              )),
            }
          : ((i === index + 1)// Si hay otra etapa adelante se la marca como que necesita cambios
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
          setProcessInfo={setProcessInfo}
        />
      )}
    </div>
  )
}
