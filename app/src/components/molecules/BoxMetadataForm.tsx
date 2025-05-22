import type { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@radix-ui/react-label"
import React, { forwardRef, useImperativeHandle, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { DatePicker } from "../atoms/datePicker"
import { Input } from "../atoms/input"
import { TimePicker } from "../atoms/timePicker"
import { boxMetadataFormSchema } from "@/lib/boxMetadataFormSchema"
import { CustomCheckbox } from "../atoms/CustomCheckbox"

export interface BoxMetadata {
    OBJECT: string | null // required
    DATE_OBS: Date | null // required
    UT: number | null // float required
}

type FormData = z.infer<typeof boxMetadataFormSchema>

type FormProps = {
    onChange: (data: any) => void
}

interface BoxMetadataFormProps {
    ref: any
}

export const BoxMetadataForm = forwardRef((props: FormProps, ref) => {
    const {
        register,
        watch,
        trigger,
        reset,
        control,
        formState: { errors, isValid },
    } = useForm<FormData>({
        resolver: zodResolver(boxMetadataFormSchema), // Conectar Zod con React Hook Form
        mode: "onChange",
    })
    const values = watch()

    React.useEffect(() => {
        props.onChange?.(values)
    }, [values])


    useImperativeHandle(ref, () => ({
        setValues: (boxMetadata: BoxMetadata) => {
            reset(boxMetadata)
        },
        resetValues: () => {
            reset()
        },
        getValues: () => {
            return watch()
        },
        validate: () => {
            trigger()
            return isValid
        },
    }))

    const inputContainerClassName = "flex flex-col w-full max-w-xs gap-1.5"
    const inputClassName = "border p-2 rounded w-4/5"

    const [isObjectActive, setObjectActive] = useState(false)
    const [isDateObs, setDateObs] = useState(false)
    const [isUniversalTime, setUniversalTime] = useState(false)

    return (
        <>
            <form>
                <div className="flex justify-between">
                    <div className={inputContainerClassName}>
                        <div className="items-center">
                            <Label>OBJECT</Label>
                            <Input
                                {...register("OBJECT")}
                                placeholder="Name of the object observed"
                                className={inputClassName}
                                disabled={isObjectActive}
                            />

                            {errors.OBJECT && !isObjectActive && <p className="text-red-500">{errors.OBJECT.message}</p>}
                        </div>
                        <div className="flex justify-start">
                            <CustomCheckbox
                                label="Missing"
                                onChange={e => { setObjectActive(e) }} />
                        </div>
                    </div>
                    <div className={inputContainerClassName}>
                        <div className="items-center">
                            <Label>DATE-OBS</Label>
                            <Controller
                                name="DATE_OBS"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Local time"
                                        disabled={isDateObs}
                                    />
                                )}

                            />
                            {errors.DATE_OBS && !isDateObs && <p className="text-red-500">{errors.DATE_OBS.message}</p>}
                        </div>
                        <div className="flex justify-start">
                            <CustomCheckbox
                                label="Missing"
                                onChange={e => { setDateObs(e) }} />
                        </div>
                    </div>
                    <div className={inputContainerClassName}>
                        <div className="items-center">
                            <Label>UT (Universal Time)</Label>
                            <Controller
                                control={control}
                                name="UT"
                                render={({ field: { value, onChange } }) => (
                                    <TimePicker
                                        date={value ? new Date(value * 1000) : undefined}
                                        setDate={date => onChange(date ? date.getTime() / 1000 : 0)}
                                        disabled={isUniversalTime}
                                    />
                                )}

                            />
                            {errors.UT && !isUniversalTime && <p className="text-red-500">{errors.UT.message}</p>}
                        </div>
                        <div className="flex justify-start">
                            <CustomCheckbox
                                label="Missing"
                                onChange={e => { setUniversalTime(e) }} />
                        </div>
                    </div>
                </div>
            </form>
        </>
    )
})
