import type { Dispatch, SetStateAction } from "react"
import type { ProcessInfoForm } from "./ProcessInfoForm"

export interface StepProps {
    processInfo: ProcessInfoForm
    setProcessInfo: Dispatch<SetStateAction<ProcessInfoForm>>
    index: number
}
