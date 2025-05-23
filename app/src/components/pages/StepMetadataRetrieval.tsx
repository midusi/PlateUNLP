import { useRef } from "react"
import { useGlobalStore } from "@/hooks/use-global-store"
import type { StepProps } from "@/interfaces/StepProps"
import { Button } from "../atoms/button"
import { BoxMetadataReadOnly } from "../molecules/BoxMetadataReadOnly"
import { SpectrumMetadataForm } from "../molecules/SpectrumMetadataForm"

export function StepMetadataRetrieval({
  index,
  processInfo,
  setProcessInfo,
}: StepProps) {
  const [setActualStep, selectedSpectrum] = useGlobalStore((s) => [
    s.setActualStep,
    s.selectedSpectrum,
  ])

  function onComplete() {
    /// AGREGAR GUARDADO DE METADATOS

    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
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
                      j === selectedSpectrum
                        ? ("NECESSARY_CHANGES" as const)
                        : state,
                    ),
                  }
                : step, // Cualquier otra etapa mantiene su informacion
        ),
      },
    }))
    setActualStep(index + 1)
  }
  const spectrumMetadataFormRef = useRef<{ setValues: (spectrumMetadata: SpectrumMetadata) => void, resetValues: () => void, getValues: () => SpectrumMetadata, validate: () => void, setIcons: (icons: SpectrumMetadataIcons) => void, getIcons: () => SpectrumMetadataIcons }>(null)

  return (
    <>
      <div className="flex flex-col items-center w-full ">
        <div className="flex flex-col w-full flex justify-center mb-6">
          <BoxMetadataReadOnly
            OBJECT={processInfo.data.spectrums[selectedSpectrum!].metadata.OBJECT}
            DATE_OBS={processInfo.data.spectrums[selectedSpectrum!].metadata.DATE_OBS}
            UT={processInfo.data.spectrums[selectedSpectrum!].metadata.UT}
          />
          <hr className="my-4" />
          <SpectrumMetadataForm ref={spectrumMetadataFormRef} />
        </div>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => spectrumMetadataFormRef.current?.resetValues()}
            className=" bg-blue-500"
          >
            Reset fields
          </Button>

          <Button
            onClick={() => {
              spectrumMetadataFormRef.current?.setIcons({
                MAIN_ID: { icon: "simbad", className: "w-32 h-8" },
                TIME_OBS: { icon: "simbad", className: "w-32 h-8" },
                ST: { icon: "simbad", className: "w-32 h-8" },
                HA: { icon: "simbad", className: "w-32 h-8" },
                RA: { icon: "simbad", className: "w-32 h-8" },
                DEC: { icon: "simbad", className: "w-32 h-8" },
                GAIN: { icon: "simbad", className: "w-32 h-8" },
                RA2000: { icon: "simbad", className: "w-32 h-8" },
                DEC2000: { icon: "simbad", className: "w-32 h-8" },
                RA1950: { icon: "simbad", className: "w-32 h-8" },
                DEC1950: { icon: "simbad", className: "w-32 h-8" },
                EXPTIME: { icon: "calculator", className: "w-8 h-8" },
                DETECTOR: { icon: "calculator", className: "w-8 h-8" },
                IMAGETYP: { icon: "calculator", className: "w-8 h-8" },
                SPTYPE: { icon: "calculator", className: "w-8 h-8" },
                JD: { icon: "simbad", className: "w-32 h-8" },
                EQUINOX: { icon: "simbad", className: "w-32 h-8" },
                AIRMASS: { icon: "simbad", className: "w-32 h-8" },
              })
            }}
            className=" bg-blue-500"
          >
            Calculate Metadata
          </Button>

          <Button
            className="w-1/4"
            onClick={() => {
              if (spectrumMetadataFormRef.current?.validate()) onComplete()
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </>
  )
}
