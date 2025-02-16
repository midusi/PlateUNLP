
import type { StepProps } from "@/interfaces/StepProps"

import { useState } from "react"
import { SegmentationUI } from "../organisms/SegmentationUI"
import { LoadFile } from "../molecules/LoadFile"



export function StepSpectrumSegmentation({ onComplete }: StepProps) {
    const [file, setFile] = useState<string | null>(null)

    return (
        <div className="w-full p-6">
            {!file && <LoadFile onSelect={(fileValue: string) => setFile(fileValue)} />}
            {file && <SegmentationUI file={file} onComplete={onComplete} />}
        </div>
    )
}

