import type { z } from "zod"
import { observatories } from "@/lib/observatories"
import { plateMetadataFormSchema } from "@/lib/plateMetadataFormSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@radix-ui/react-label"
import { useImperativeHandle } from "react"
import { Controller, useForm } from "react-hook-form"
import { Input } from "../atoms/input"
import SelectForm from "../atoms/selectForm"
import { TimePicker } from "../atoms/timePicker"

export interface PlateMetadata {
  OBSERVAT: string
  OBSERVER: string
  DIGITALI: number // time/timestamp
  SCANNER: string
  SOFTWARE: string
  PLATE_N: string
}

const options = observatories

type FormData = z.infer<typeof plateMetadataFormSchema>

interface PlateMetadataFormProps {
  ref: any
}

export function PlateMetadataForm({ ref }: PlateMetadataFormProps) {
  const {
    register,
    watch,
    trigger,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(plateMetadataFormSchema), // Conectar Zod con React Hook Form
    mode: "onChange",
  })

  useImperativeHandle(ref, () => ({
    setValues: (plateMetadata: PlateMetadata) => {
      reset(plateMetadata)
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

  const inputContainerClassName = "w-full max-w-xs items-center gap-1.5"
  const inputClassName = "border p-2 rounded"
  return (
    <>
      <form className="w-full max-w-7xl">
        <div className="flex flex-wrap justify-center content-normal gap-4">
          <div className={inputContainerClassName}>
            <Label>OBSERVAT</Label>
            <Controller
              name="OBSERVAT"
              control={control}
              render={({ field, fieldState }) => (
                <SelectForm
                  field={field}
                  options={options}
                  className={inputClassName}
                  error={fieldState.error}
                />
              )}
            />

            {errors.OBSERVER && <p className="text-red-500">{errors.OBSERVER.message}</p>}
          </div>

          <div className={inputContainerClassName}>
            <Label>OBSERVER</Label>
            <Input {...register("OBSERVER")} placeholder="OBSERVER" className={inputClassName} />
            {errors.OBSERVER && <p className="text-red-500">{errors.OBSERVER.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>DIGITALI</Label>
            <Controller
              control={control}
              name="DIGITALI"
              render={({ field: { value, onChange } }) => (
                <TimePicker
                  date={value ? new Date(value * 1000) : undefined}
                  setDate={date => onChange(date ? date.getTime() / 1000 : 0)}
                />
              )}
            />
            {errors.DIGITALI && <p className="text-red-500">{errors.DIGITALI.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>SCANNER</Label>
            <Input {...register("SCANNER")} placeholder="Scanner name" className={inputClassName} />
            {errors.SCANNER && <p className="text-red-500">{errors.SCANNER.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>SOFTWARE</Label>
            <Input {...register("SOFTWARE")} placeholder="Scan software" className={inputClassName} />
            {errors.SOFTWARE && <p className="text-red-500">{errors.SOFTWARE.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>PLATE-N</Label>
            <Input {...register("PLATE_N")} placeholder="Identification number" className={inputClassName} />
            {errors.PLATE_N && <p className="text-red-500">{errors.PLATE_N.message}</p>}
          </div>
        </div>
      </form>
    </>
  )
}
