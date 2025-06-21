import { useRef } from "react"
import { useGlobalStore } from "~/hooks/use-global-store"
import type { StepProps } from "~/types/StepProps"
import { Button } from "../atoms/button"
import type { PlateMetadata } from "../molecules/PlateMetadataForm"
import { PlateMetadataForm } from "../molecules/PlateMetadataForm"

export function StepPlateMetadata({ index, /* processInfo, */ setProcessInfo }: StepProps) {
  const [setActualStep] = useGlobalStore((s) => [s.setActualStep])
  function onComplete(plateMetadata: PlateMetadata) {
    /// AGREGAR GUARDADO DE METADATOS

    setProcessInfo((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        plate: {
          ...prev.data.plate,
          sharedMetadata: plateMetadata,
        },
      },
    }))

    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    setProcessInfo((prev) => ({
      ...prev,
      processingStatus: {
        ...prev.processingStatus,
        generalSteps: prev.processingStatus.generalSteps.map((step, i) => ({
          ...step,
          state: index === i ? "COMPLETE" : index + 1 === i ? "NECESSARY_CHANGES" : step.state,
        })),
      },
    }))
    setActualStep(index + 1)
  }

  const plateMetadataFormRef = useRef<{
    setValues: (spectrumMetadata: PlateMetadata) => void
    resetValues: () => void
    getValues: () => PlateMetadata
    validate: () => void
  }>(null)
  return (
    <div className="flex flex-col items-center w-full ">
      <div className="w-full flex justify-center mb-6">
        <PlateMetadataForm ref={plateMetadataFormRef} />
      </div>
      <div className="flex gap-4 justify-center">
        {/* <Button
          onClick={() => plateMetadataFormRef.current?.resetValues()}
          className=" bg-blue-500"
        >
          Reset fields
        </Button> */}
        <Button
          onClick={() => {
            if (plateMetadataFormRef.current?.validate()) {
              onComplete(plateMetadataFormRef.current?.getValues())
            }
          }}
        >
          Save
        </Button>
      </div>
    </div>
  )
}
