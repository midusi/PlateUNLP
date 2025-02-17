import type { StepProps } from "@/interfaces/StepProps"
import type { SpectrumMetadata } from "../molecules/SpectrumMetadataForm"
import { useRef } from "react"
import { Button } from "../atoms/button"
import { SpectrumMetadataForm } from "../molecules/SpectrumMetadataForm"

export function StepMetadataRetrieval({ onComplete }: StepProps) {
    const spectrumMetadataFormRef = useRef<{ setValues: (spectrumMetadata: SpectrumMetadata) => void, getValues: () => SpectrumMetadata, validate: () => void }>(null)
    return (
        <>
            <SpectrumMetadataForm ref={spectrumMetadataFormRef} />
            <div className="flex mt-4">
                <Button
                    onClick={() => console.log(spectrumMetadataFormRef.current?.getValues())}
                    className="bg-blue-500 text-white p-2 rounded"
                >
                    Get
                </Button>
                <Button
                    onClick={() => console.log(`formulario correcto: ${spectrumMetadataFormRef.current?.validate()}`)}
                    className="bg-blue-500 text-white p-2 rounded"
                >
                    Validate
                </Button>
                <Button
                    onClick={() => spectrumMetadataFormRef.current?.setValues({
                        OBJECT: "defult",
                        DATE_OBS: new Date(),
                        TIME_OBS: 0,
                        MAIN_ID: "default-id",
                        UT: 0,
                        ST: 0,
                        HA: 0,
                        RA: 0,
                        DEC: 0,
                        GAIN: 0,
                        RA2000: 0,
                        DEC2000: 0,
                        RA1950: 0,
                        DEC1950: 0,
                        EXPTIME: 0,
                        DETECTOR: "",
                        IMAGETYP: "",
                        SPTYPE: "",
                        JD: 0,
                        EQUINOX: 0,
                    })}
                    className=" bg-blue-500 text-white p-2 rounded"
                >
                    Set
                </Button>
            </div>

            <Button
                onClick={() => { onComplete() }}
                disabled
            >
                Save
            </Button>
        </>
    )
}
