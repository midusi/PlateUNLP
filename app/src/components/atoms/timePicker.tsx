import type { Period } from "./timePickerUtils"
import * as React from "react"
import { Label } from "./label"
import { TimePeriodSelect } from "./periodSelect"
import { TimePickerInput } from "./timePickerInput"

interface TimePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    disabled?: boolean
}

export function TimePicker({ date, setDate, disabled = false }: TimePickerProps) {
    const minuteRef = React.useRef<HTMLInputElement>(null)
    const hourRef = React.useRef<HTMLInputElement>(null)
    const secondRef = React.useRef<HTMLInputElement>(null)

    return (
        <div className="flex gap-2">
            <div className="flex">
                <Label htmlFor="hours" className="text-xs">
                    H
                </Label>
                <TimePickerInput
                    picker="hours"
                    date={date}
                    setDate={setDate}
                    ref={hourRef}
                    onRightFocus={() => minuteRef.current?.focus()}
                    disabled={disabled}
                />
            </div>
            <div className="flex">
                <Label htmlFor="minutes" className="text-xs">
                    M
                </Label>
                <TimePickerInput
                    picker="minutes"
                    id="minutes12"
                    date={date}
                    setDate={setDate}
                    ref={minuteRef}
                    onLeftFocus={() => hourRef.current?.focus()}
                    onRightFocus={() => secondRef.current?.focus()}
                    disabled={disabled}
                />
            </div>
            <div className="flex">
                <Label htmlFor="seconds" className="text-xs">
                    S
                </Label>
                <TimePickerInput
                    picker="seconds"
                    id="seconds12"
                    date={date}
                    setDate={setDate}
                    ref={secondRef}
                    onLeftFocus={() => minuteRef.current?.focus()}
                    disabled={disabled}
                />
            </div>
        </div>
    )
}
