import { useRef, useState } from "react"
import { useGlobalStore } from "@/hooks/use-global-store"
import type { StepProps } from "@/interfaces/StepProps"
import { Button } from "../atoms/button"
import type { PlateMetadata } from "../molecules/PlateMetadataForm"
import { PlateMetadataForm } from "../molecules/PlateMetadataForm"

export function StepPlateMetadata({
  index,
  setProcessInfo,
}: StepProps) {
  /** Funcion para modificar el paso actual en la barra de navegacion. */
  const [setActualStep] = useGlobalStore((s) => [s.setActualStep])

  /** 
   * Condicion boleana y su funcion de modificación para identificar si el 
   * formulario esta listo para ser enviado.
  */
  const [valid, setValid] = useState<boolean>(false)
  
  /** Referencia al formulario donde se ingresan los metadatos metadatos */
  const plateMetadataFormRef = useRef<{
    setValues: (spectrumMetadata: PlateMetadata) => void
    resetValues: () => void
    getValues: () => PlateMetadata
    validate: () => boolean
  }>(null)

  /** 
   * Funcion a ejecutar al completar el paso actual. 
   * Actualiza valores de metadatos en processInfo y marca el paso actual
   * como completado.
   */
  function onComplete(plateMetadata: PlateMetadata) {
    /** Actualiza proces info con los valores de los metadatos de placa especificados */
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
          state:
            index === i
              ? "COMPLETE"
              : index + 1 === i
                ? "NECESSARY_CHANGES"
                : step.state,
        })),
      },
    }))
    setActualStep(index + 1)
  }

  return (
    <div className="flex flex-col items-center w-full ">
      <div className="w-full flex justify-center mb-6">
        <PlateMetadataForm ref={plateMetadataFormRef}  setValidForm={setValid}/>
      </div>
      <div className="flex gap-4 justify-center">
        {/* <Button
          onClick={() => plateMetadataFormRef.current?.resetValues()}
          className=" bg-blue-500"
        >
          Reset fields
        </Button> */}
        <Button
          onClick={() => { onComplete(plateMetadataFormRef.current!.getValues()) }}
          disabled={!valid}
        >
          Save
        </Button>
      </div>
    </div>
  )
}
