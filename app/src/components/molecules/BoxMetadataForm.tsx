import type { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@radix-ui/react-label"
import React, { forwardRef, useImperativeHandle } from "react"
import { Controller, useForm } from "react-hook-form"
import { DatePicker } from "../atoms/datePicker"
import { Input } from "../atoms/input"
import { TimePicker } from "../atoms/timePicker"
import { boxMetadataFormSchema } from "@/lib/boxMetadataFormSchema"
import { useEffect } from "react"

export interface BoxMetadata {
    OBJECT: string // required
    DATE_OBS: Date // required
    MAIN_ID: string // required
    UT: number // float required
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

    const inputContainerClassName = "flex flex-col w-full max-w-xs items-center gap-1.5"
    const inputClassName = "border p-2 rounded w-4/5"

    return (
        <>
            <form>
                <div className="flex justify-between">
                    <div className={inputContainerClassName}>
                        <Label>OBJECT</Label>
                        <Input
                            {...register("OBJECT")}
                            placeholder="Name of the object observed"
                            className={inputClassName}
                        />
                        {errors.OBJECT && <p className="text-red-500">{errors.OBJECT.message}</p>}
                    </div>
                    <div className={inputContainerClassName}>
                        <Label>DATE-OBS</Label>
                        <Controller
                            name="DATE_OBS"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="Local time"
                                />
                            )}
                        />
                        {errors.DATE_OBS && <p className="text-red-500">{errors.DATE_OBS.message}</p>}
                    </div>
                    <div className={inputContainerClassName}>
                        <Label>MAIN-ID</Label>
                        <Input
                            {...register("MAIN_ID")}
                            placeholder="Simbad main ID object name"
                            className={inputClassName}
                        />
                        {errors.MAIN_ID && <p className="text-red-500">{errors.MAIN_ID.message}</p>}
                    </div>
                    <div className={inputContainerClassName}>
                        <Label>UT (Universal Time)</Label>
                        <Controller
                            control={control}
                            name="UT"
                            render={({ field: { value, onChange } }) => (
                                <TimePicker
                                    date={value ? new Date(value * 1000) : undefined}
                                    setDate={date => onChange(date ? date.getTime() / 1000 : 0)}
                                />
                            )}
                        />
                        {errors.UT && <p className="text-red-500">{errors.UT.message}</p>}
                    </div>
                </div>
            </form>
        </>
    )
})
