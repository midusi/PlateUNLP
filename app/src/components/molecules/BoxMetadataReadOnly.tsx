import { Label } from "@radix-ui/react-label"
import { DatePicker } from "../atoms/datePicker"
import { Input } from "../atoms/input"
import { TimePicker } from "../atoms/timePicker"
import React from 'react';

type BoxMetadataReadOnlyProps = {
    OBJECT: string | null
    DATE_OBS: Date | null
    UT: number | null
}


export const BoxMetadataReadOnly: React.FC<BoxMetadataReadOnlyProps> = ({ OBJECT, DATE_OBS, UT }) => {
    const inputContainerClassName = "flex flex-col w-full max-w-xs gap-1.5"
    const inputClassName = "border p-2 rounded w-4/5"
    return (
        <>
            <div className="flex flex-wrap justify-center content-normal gap-4">
                <div className={inputContainerClassName}>
                    <div className="items-center">
                        <Label>OBJECT</Label>
                        <Input
                            className={inputClassName}
                            disabled={true}
                            value={OBJECT != null ? OBJECT : undefined}
                            placeholder="MISSING"
                        />
                    </div>
                </div>
                <div className={inputContainerClassName}>
                    <div className="items-center">
                        <Label>DATE-OBS</Label>
                        <DatePicker
                            value={DATE_OBS != null ? DATE_OBS : undefined}
                            disabled={true}
                            placeholder="MISSING"
                        />

                    </div>
                </div>
                <div className={inputContainerClassName}>
                    <div className="items-center">
                        <Label>UT (Universal Time)</Label>
                        <TimePicker
                            date={UT != null ? new Date(UT * 1000) : undefined}
                            setDate={date => UT}
                            disabled={true}
                        />

                    </div>
                </div>
            </div>
        </>
    )
}
