import type { StepProps } from "@/interfaces/StepProps"
import type { PlateMetadata } from "../molecules/PlateMetadataForm"
import { useGlobalStore } from "@/hooks/use-global-store"
import { useRef } from "react"
import { Button } from "../atoms/button"
import { PlateMetadataForm } from "../molecules/PlateMetadataForm"

export function StepPlateMetadata({ index, processInfo, setProcessInfo }: StepProps) {
  const [setActualStep] = useGlobalStore(s => [
    s.setActualStep,
  ])
  function onComplete(plateMetadata: PlateMetadata) {
    /// AGREGAR GUARDADO DE METADATOS

    setProcessInfo((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        plate: {
          ...prev.data.plate,
          sharedMetadata: [
            ...prev.data.plate.sharedMetadata.filter(
              (item) => !["PlateMetaData"].includes(item.key)
            ), // Para no tener claves duplicadas borra las anteriores si existen
            { key: "PlateMetaData", value: plateMetadata }
          ],
        },
      },
    }));


    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
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
      },
    }))
    setActualStep(index + 1)
  }

  const plateMetadataFormRef = useRef<{ setValues: (spectrumMetadata: PlateMetadata) => void, resetValues: () => void, getValues: () => PlateMetadata, validate: () => void }>(null)
  return (
    <>
      <PlateMetadataForm ref={plateMetadataFormRef} />
      <div className="flex justify-evenly mt-6">
        <Button
          onClick={() => plateMetadataFormRef.current?.resetValues()}
          className=" bg-blue-500 w-1/4"
        >
          Reset fields
        </Button>

        <Button
          className="w-1/4"
          onClick={() => {
            if (plateMetadataFormRef.current?.validate()) {

              onComplete(plateMetadataFormRef.current?.getValues())
            }
          }}
        >
          Save
        </Button>
      </div>
    </>
  )
}
