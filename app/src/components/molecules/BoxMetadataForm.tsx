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
export interface BoxMetadataNulls {
    OBJECT: boolean
    DATE_OBS: boolean
    UT: boolean
}

type FormData = z.infer<typeof boxMetadataFormSchema>

type FormProps = {
    onChange: (data: any, nulls: any) => void
    initialValues?: BoxMetadata
    initialNulls?: BoxMetadataNulls
}

interface BoxMetadataFormProps {
    ref: any
}

export const BoxMetadataForm = forwardRef((props: FormProps, ref) => {
    const [boxMetadataNulls, setBoxMetadataNulls] = useState<BoxMetadataNulls>(props.initialNulls || { OBJECT: false, DATE_OBS: false, UT: false })
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
        defaultValues: props.initialValues || {}
    })
    const values = watch()

    React.useEffect(() => {
        props.onChange?.(values, boxMetadataNulls)
    }, [values])


    useImperativeHandle(ref, () => ({
        setValues: (boxMetadata: BoxMetadata) => {
            reset(boxMetadata)
        },
        setNulls: (boxMetadataNulls: BoxMetadataNulls) => {
            setBoxMetadataNulls(boxMetadataNulls)
        },
        resetValues: () => {
            reset()
        },
        getValues: () => {
            return watch()
        },
        getNulls: () => {
            return boxMetadataNulls
        },
        validate: async () => {
            await trigger()
            return isValid
        },
        getIsValid: () => {
            const isEmpty = (value: any) => value === null || value === undefined || value === '';

            const isObjectValid =
                boxMetadataNulls.OBJECT || (!errors.OBJECT && !isEmpty(values.OBJECT));

            const isDateObsValid =
                boxMetadataNulls.DATE_OBS || (!errors.DATE_OBS && !isEmpty(values.DATE_OBS));

            const isUTValid =
                boxMetadataNulls.UT || (!errors.UT && !isEmpty(values.UT));

            return isObjectValid && isDateObsValid && isUTValid;
        }
    }))

    const inputContainerClassName = "flex flex-col w-full max-w-xs gap-1.5"
    const inputClassName = "border p-2 rounded w-4/5"

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
                                disabled={boxMetadataNulls.OBJECT}
                            />

                            {errors.OBJECT && !boxMetadataNulls.OBJECT && <p className="text-red-500">{errors.OBJECT.message}</p>}
                        </div>
                        <div className="flex justify-start">
                            <CustomCheckbox
                                checked={boxMetadataNulls.OBJECT}
                                label="Missing"
                                onChange={e => {
                                    setBoxMetadataNulls(prev => ({
                                        ...prev,
                                        OBJECT: e,
                                    }))
                                }} />
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
                                        disabled={boxMetadataNulls.DATE_OBS}
                                    />
                                )}

                            />
                            {errors.DATE_OBS && !boxMetadataNulls.DATE_OBS && <p className="text-red-500">{errors.DATE_OBS.message}</p>}
                        </div>
                        <div className="flex justify-start">
                            <CustomCheckbox
                                checked={boxMetadataNulls.DATE_OBS}
                                label="Missing"
                                onChange={e => {
                                    setBoxMetadataNulls(prev => ({
                                        ...prev,
                                        DATE_OBS: e,
                                    }))
                                }} />
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
                                        disabled={boxMetadataNulls.UT}
                                    />
                                )}

                            />
                            {errors.UT && !boxMetadataNulls.UT && <p className="text-red-500">{errors.UT.message}</p>}
                        </div>
                        <div className="flex justify-start">
                            <CustomCheckbox
                                checked={boxMetadataNulls.UT}
                                label="Missing"
                                onChange={e => {
                                    setBoxMetadataNulls(prev => ({
                                        ...prev,
                                        UT: e,
                                    }))
                                }} />
                        </div>
                    </div>
                </div>
            </form>
        </>
    )
})
