import type { StepProps } from "@/interfaces/StepProps"
import type { SpectrumMetadata } from "../molecules/SpectrumMetadataForm"
import { useGlobalStore } from "@/hooks/use-global-store"
import { useRef } from "react"
import { Button } from "../atoms/button"
import { SpectrumMetadataForm } from "../molecules/SpectrumMetadataForm"
import { BoxMetadataReadOnly } from "../molecules/BoxMetadataReadOnly"

export function StepMetadataRetrieval({ index, processInfo, setProcessInfo }: StepProps) {
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum,
  ])

  function onComplete() {
    /// AGREGAR GUARDADO DE METADATOS

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
      },
    }))
    setActualStep(index + 1)
  }
  const spectrumMetadataFormRef = useRef<{ setValues: (spectrumMetadata: SpectrumMetadata) => void, resetValues: () => void, getValues: () => SpectrumMetadata, validate: () => void }>(null)
  return (
    <>

      <div className="flex flex-col items-center w-full ">

        <div className="flex flex-col w-full flex justify-center mb-6">
          <BoxMetadataReadOnly
            OBJECT={processInfo.data.spectrums[selectedSpectrum].metadata.OBJECT}
            DATE_OBS={processInfo.data.spectrums[selectedSpectrum].metadata.DATE_OBS}
            UT={processInfo.data.spectrums[selectedSpectrum].metadata.UT}
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
            onClick={() => { }}
            className=" bg-blue-500"
          >
            Calculate Metadata
          </Button>

          <Button
            className="w-1/4"
            onClick={() => {
              if (spectrumMetadataFormRef.current?.validate())
                onComplete()
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </>
  )
}
