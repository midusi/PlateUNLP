import type { Period } from "./timePickerUtils"
import * as React from "react"
import { Label } from "./label"
import { TimePeriodSelect } from "./periodSelect"
import { TimePickerInput } from "./timePickerInput"

interface TimePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
}

export function TimePicker({ date, setDate }: TimePickerProps) {
    const [period, setPeriod] = React.useState<Period>("PM")

    const minuteRef = React.useRef<HTMLInputElement>(null)
    const hourRef = React.useRef<HTMLInputElement>(null)
    const secondRef = React.useRef<HTMLInputElement>(null)
    const periodRef = React.useRef<HTMLButtonElement>(null)

    return (
        <div className="flex items-end gap-2">
            <div className="grid gap-1 text-center">
                <Label htmlFor="hours" className="text-xs">
                    Hours
                </Label>
                <TimePickerInput
                    picker="12hours"
                    period={period}
                    date={date}
                    setDate={setDate ? date => setDate(date) : () => { }}
                    ref={hourRef}
                    onRightFocus={() => minuteRef.current?.focus()}
                />
            </div>
            <div className="grid gap-1 text-center">
                <Label htmlFor="minutes" className="text-xs">
                    Minutes
                </Label>
                <TimePickerInput
                    picker="minutes"
                    id="minutes12"
                    date={date}
                    setDate={setDate ? date => setDate(date) : () => { }}
                    ref={minuteRef}
                    onLeftFocus={() => hourRef.current?.focus()}
                    onRightFocus={() => secondRef.current?.focus()}
                />
            </div>
            <div className="grid gap-1 text-center">
                <Label htmlFor="seconds" className="text-xs">
                    Seconds
                </Label>
                <TimePickerInput
                    picker="seconds"
                    id="seconds12"
                    date={date}
                    setDate={setDate ? date => setDate(date) : () => { }}
                    ref={secondRef}
                    onLeftFocus={() => minuteRef.current?.focus()}
                    onRightFocus={() => periodRef.current?.focus()}
                />
            </div>
            <div className="grid gap-1 text-center">
                <Label htmlFor="period" className="text-xs">
                    Period
                </Label>
                <TimePeriodSelect
                    period={period}
                    setPeriod={setPeriod}
                    date={date}
                    setDate={setDate ? date => setDate(date) : () => { }}
                    ref={periodRef}
                    onLeftFocus={() => secondRef.current?.focus()}
                />
            </div>
        </div>
    )
}
