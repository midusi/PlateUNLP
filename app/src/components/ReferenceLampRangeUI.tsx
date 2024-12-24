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
    const [rangeMin, setRangeMin, rangeMax] = useGlobalStore(s => [
        s.rangeMin,
        s.setRangeMin,
        s.rangeMax,
    ])

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>Min. wavelength</Label>
            <div className="flex items-center gap-1">
                <Input
                    id={inputId}
                    type="number"
                    value={rangeMin}
                    onChange={(e) => {
                        const value = Number(e.target.value)
                        if (value < rangeMax)
                            setRangeMin(value)
                    }}
                    className="tabular-nums disabled:cursor-default"
                />
                <span className="text-gray-500">Å</span>
            </div>
        </div>
    )
}

function MaxInput() {
    const inputId = useId()
    const [rangeMax, setRangeMax, rangeMin] = useGlobalStore(s => [
        s.rangeMax,
        s.setRangeMax,
        s.rangeMin,
    ])

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={inputId}>Max. wavelength</Label>
            <div className="flex items-center gap-1">
                <Input
                    id={inputId}
                    type="number"
                    value={rangeMax}
                    className="tabular-nums disabled:opacity-100 disabled:cursor-default"
                    onChange={(e) => {
                        const value = Number(e.target.value)
                        if (value > rangeMin)
                            setRangeMax(value)
                    }}
                />
                <span className="text-gray-500">Å</span>
            </div>
        </div>
    )
}
