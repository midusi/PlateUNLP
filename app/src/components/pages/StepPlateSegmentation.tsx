import type { StepProps } from "@/interfaces/StepProps"
import { useState } from "react"
import { Button } from "../atoms/button"
import { LoadFile } from "../molecules/LoadFile"
import { SegmentationUI } from "../organisms/SegmentationUI"

export function StepPlateSegmentation({ onComplete }: StepProps) {
    const [file, setFile] = useState<string | null>(null)
    return (
        <>
            <div className="w-full p-6">
                {!file && <LoadFile onSelect={(fileValue: string) => setFile(fileValue)} />}
                {file && <SegmentationUI file={file} onComplete={onComplete} enableAutodetect={false} />}
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
