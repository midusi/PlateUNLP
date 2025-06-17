import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@radix-ui/react-label"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod/v4"
import { boxMetadataFormSchema, FormData } from "@/lib/boxMetadataFormSchema"
import { CustomCheckbox } from "../atoms/CustomCheckbox"
import { DatePicker } from "../atoms/datePicker"
import { Input } from "../atoms/input"
import { TimePicker } from "../atoms/timePicker"
import React from "react"

/** 
 * Parametros recibidos por SelectedObservationForm
 * @interface SelectedObservationForm
 */
interface SelectedObservationFormProps {
  
  boxId: number
}

/** 
 * Componente que muestra un formulario que permite editar algunos campos 
 * relecionados a una observacion.
 */
export function SelectedObservationForm({}:SelectedObservationFormProps) {
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

  const [isObjectActive, setObjectActive] = useState(false)
  const [isDateObs, setDateObs] = useState(false)
  const [isUniversalTime, setUniversalTime] = useState(false)

  React.useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (["OBJECT", "DATE_OBS", "UT"].includes(name || "")) {
        // Ejecutá tu lógica acá
        console.log("Campo modificado:", name, "Nuevo valor:", value[name!])
      }
    });

    return () => subscription.unsubscribe(); // Limpieza
  }, [watch]);

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
                disabled={isObjectActive}
              />

              {errors.OBJECT && !isObjectActive && (
                <p className="text-red-500">{errors.OBJECT.message}</p>
              )}
            </div>
            <div className="flex justify-start">
              <CustomCheckbox
                label="Missing"
                onChange={(e) => {
                  setObjectActive(e)
                }}
              />
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
              {errors.DATE_OBS && !isDateObs && (
                <p className="text-red-500">{errors.DATE_OBS.message}</p>
              )}
            </div>
            <div className="flex justify-start">
              <CustomCheckbox
                label="Missing"
                onChange={(e) => {
                  setDateObs(e)
                }}
              />
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
                    setDate={(date) =>
                      onChange(date ? date.getTime() / 1000 : 0)
                    }
                    disabled={isUniversalTime}
                  />
                )}
              />
              {errors.UT && !isUniversalTime && (
                <p className="text-red-500">{errors.UT.message}</p>
              )}
            </div>
            <div className="flex justify-start">
              <CustomCheckbox
                label="Missing"
                onChange={(e) => {
                  setUniversalTime(e)
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
