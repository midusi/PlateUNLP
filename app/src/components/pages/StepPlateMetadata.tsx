import type { StepProps } from "@/interfaces/StepProps"
import type { PlateMetadata } from "../molecules/PlateMetadataForm"
import { useRef } from "react"
import { Button } from "../atoms/button"
import { PlateMetadataForm } from "../molecules/PlateMetadataForm"

export function StepPlateMetadata({ index, setProcessInfo }: StepProps) {
    function onComplete() {
        /// Marca el paso actual como completado y el que le sigue como
        /// que necesita actualizaciones
        setProcessInfo(prev => ({
            ...prev,
            general: prev.general.map((step, i) => ({
                ...step,
                state: index === i
                    ? "COMPLETE"
                    : (index + 1 === i
                        ? "NECESSARY_CHANGES"
                        : step.state),
            })),
        }))
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
                        if (plateMetadataFormRef.current?.validate())
                            onComplete()
                    }}
                >
                    Save
                </Button>
            </div>
        </>
    )
}
