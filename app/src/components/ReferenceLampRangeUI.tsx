import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGlobalStore } from "@/hooks/use-global-store"
import { useId } from "react"
import { ReferenceLampRange } from "./ReferenceLampRange"

export function ReferenceLampRangeUI() {
    return (
        <div className="flex w-full overflow-hidden">
            <div className="flex-8" style={{ width: `90%` }}>
                <ReferenceLampRange />
            </div>
            <div className="m-4 flex-2 w-[200px]">
                <div className="pb-3"><MinInput /></div>
                <div className=""><MaxInput /></div>
            </div>
        </div>
    )
}

function MinInput() {
    const inputId = useId()
    const rangeMin = useGlobalStore(s => s.rangeMin)

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>Min. wavelength</Label>
            <Input
                id={inputId}
                type="text"
                value={`${rangeMin} Å`}
                className="tabular-nums disabled:opacity-100 disabled:cursor-default"
                disabled
            />
        </div>
    )
}

function MaxInput() {
    const inputId = useId()
    const rangeMax = useGlobalStore(s => s.rangeMax)

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>Max. wavelength</Label>
            <Input
                id={inputId}
                type="text"
                value={`${rangeMax} Å`}
                className="tabular-nums disabled:opacity-100 disabled:cursor-default"
                disabled
            />
        </div>
    )
}
