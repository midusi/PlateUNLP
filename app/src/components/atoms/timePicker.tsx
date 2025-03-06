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
        <div className="flex gap-2">
            <div className="flex">
                <Label htmlFor="hours" className="text-xs">
                    H
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
            <div className="flex">
                <Label htmlFor="minutes" className="text-xs">
                    M
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
            <div className="flex">
                <Label htmlFor="seconds" className="text-xs">
                    S
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
            <div className="flex">
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
