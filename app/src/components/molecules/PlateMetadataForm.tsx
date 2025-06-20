import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@radix-ui/react-label"
import { Dispatch, RefObject, SetStateAction, useEffect, useImperativeHandle } from "react"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod/v4"
import { plateMetadataFormSchema } from "@/lib/plateMetadataFormSchema"
import { Input } from "../atoms/input"
import SelectForm from "../atoms/selectForm"

export interface PlateMetadata {
  OBSERVAT: string
  OBSERVER: string
  DIGITALI: string
  SCANNER: string
  SOFTWARE: string
  PLATE_N: string
  TELESCOPE: string
  DETECTOR: string
  INSTRUMENT: string
}

const options = []

type FormData = z.infer<typeof plateMetadataFormSchema>

/**
 * Parametros que espera recibir el componente PlateMetadataForm.
 * @interface PlateMetadataForm
 */
interface PlateMetadataFormProps {
  /** Referencia a enlazar al formulario para su uso desde mas arriba */
  ref: RefObject<{
    setValues: (spectrumMetadata: PlateMetadata) => void;
    resetValues: () => void;
    getValues: () => PlateMetadata;
    validate: () => boolean;
  } | null>
  /** Funcion para reportar a componente superior si el formulario es valido o no. */
  setValidForm: Dispatch<SetStateAction<boolean>>
}

/** 
 * Componente que muestra un formulario con entradas para todos los 
 * metadatos que son comunes a una placa.
 */
export function PlateMetadataForm({ ref, setValidForm }: PlateMetadataFormProps) {
  const {
    register,
    watch,
    trigger,
    reset,
    getValues,
    control,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(plateMetadataFormSchema), // Conectar Zod con React Hook Form
    mode: "onChange",
  })

  /** Actualiza variable de valides del padre */
  useEffect(() => {
    setValidForm(isValid)
  }, [isValid])

  useImperativeHandle(ref, () => ({
    setValues: (plateMetadata: PlateMetadata) => {
      reset(plateMetadata)
    },
    resetValues: () => {
      reset()
    },
    getValues: () => {
      return getValues() as PlateMetadata
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

            {errors.OBSERVAT && (
              <p className="text-red-500">{errors.OBSERVAT.message}</p>
            )}
          </div>
          <div className={inputContainerClassName}>
            <Label>PLATE-N</Label>
            <Input
              {...register("PLATE_N")}
              placeholder="Identification number"
              className={inputClassName}
            />
            {errors.PLATE_N && (
              <p className="text-red-500">{errors.PLATE_N.message}</p>
            )}
          </div>

          <div className={inputContainerClassName}>
            <Label>OBSERVER</Label>
            <Input
              {...register("OBSERVER")}
              placeholder="OBSERVER"
              className={inputClassName}
            />
            {errors.OBSERVER && (
              <p className="text-red-500">{errors.OBSERVER.message}</p>
            )}
          </div>
          <div className={inputContainerClassName}>
            <Label>DIGITALI</Label>
            <Input
              {...register("DIGITALI")}
              placeholder="DIGITALI"
              className={inputClassName}
            />
            {errors.DIGITALI && (
              <p className="text-red-500">{errors.DIGITALI.message}</p>
            )}
          </div>
          <div className={inputContainerClassName}>
            <Label>SCANNER</Label>
            <Input
              {...register("SCANNER")}
              placeholder="Scanner name"
              className={inputClassName}
            />
            {errors.SCANNER && (
              <p className="text-red-500">{errors.SCANNER.message}</p>
            )}
          </div>
          <div className={inputContainerClassName}>
            <Label>SOFTWARE</Label>
            <Input
              {...register("SOFTWARE")}
              placeholder="Scan software"
              className={inputClassName}
            />
            {errors.SOFTWARE && (
              <p className="text-red-500">{errors.SOFTWARE.message}</p>
            )}
          </div>
          <div className={inputContainerClassName}>
            <Label>TELESCOPE</Label>
            <Input
              {...register("TELESCOPE")}
              placeholder="Telescope name"
              className={inputClassName}
            />
            {errors.TELESCOPE && (
              <p className="text-red-500">{errors.TELESCOPE.message}</p>
            )}
          </div>
          <div className={inputContainerClassName}>
            <Label>DETECTOR</Label>
            <Input
              {...register("DETECTOR")}
              placeholder="Detector"
              className={inputClassName}
            />
            {errors.DETECTOR && (
              <p className="text-red-500">{errors.DETECTOR.message}</p>
            )}
          </div>
          <div className={inputContainerClassName}>
            <Label>INSTRUMENT</Label>
            <Input
              {...register("INSTRUMENT")}
              placeholder="Instrument"
              className={inputClassName}
            />
            {errors.INSTRUMENT && (
              <p className="text-red-500">{errors.INSTRUMENT.message}</p>
            )}
          </div>
        </div>
      </form>
    </>
  )
}
