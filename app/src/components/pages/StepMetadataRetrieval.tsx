import type { StepProps } from "@/interfaces/StepProps"
import { Button } from "../atoms/button"

export function StepMetadataRetrieval({ onComplete }: StepProps) {
    return (
        <>
            1
            <Button
                onClick={() => { onComplete() }}
                disabled
            >
                Save
            </Button>
        </>
    )
}
