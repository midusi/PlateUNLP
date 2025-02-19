import type { StepProps } from "@/interfaces/StepProps"
import type { SpectrumMetadata } from "../molecules/SpectrumMetadataForm"
import { useRef } from "react"
import { Button } from "../atoms/button"
import { SpectrumMetadataForm } from "../molecules/SpectrumMetadataForm"

export function StepMetadataRetrieval({ onComplete }: StepProps) {
    const spectrumMetadataFormRef = useRef<{ setValues: (spectrumMetadata: SpectrumMetadata) => void, resetValues: () => void, getValues: () => SpectrumMetadata, validate: () => void }>(null)
    return (
        <>
            <SpectrumMetadataForm ref={spectrumMetadataFormRef} />
            <div className="flex justify-evenly mt-6">
                <Button
                    onClick={() => spectrumMetadataFormRef.current?.resetValues()}
                    className=" bg-blue-500 w-1/4"
                >
                    Reset fields
                </Button>

                <Button className="w-1/4"
                    onClick={() => { if (spectrumMetadataFormRef.current?.validate()) onComplete() }}
                >
                    Save
                </Button>
            </div>
        </>
    )
}
