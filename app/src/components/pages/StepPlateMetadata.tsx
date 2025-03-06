import type { StepProps } from "@/interfaces/StepProps"
import { useRef } from "react"
import { Button } from "../atoms/button"
import { PlateMetadata, PlateMetadataForm } from "../molecules/PlateMetadataForm"

export function StepPlateMetadata({ onComplete }: StepProps) {
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

                <Button className="w-1/4"
                    onClick={() => { if (plateMetadataFormRef.current?.validate()) onComplete() }}
                >
                    Save
                </Button>
            </div>
        </>
    )
}
