import { zodResolver } from "@hookform/resolvers/zod"
import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Label } from "~/components/atoms/label"
import { boxMetadataFormSchema, type FormData } from "~/lib/boxMetadataFormSchema"
import { CustomCheckbox } from "../atoms/CustomCheckbox"
import { DatePicker } from "../atoms/datePicker"
import { Input } from "../atoms/input"
import { TimePicker } from "../atoms/timePicker"

export interface BoxMetadata {
  OBJECT?: string | null // required
  DATE_OBS?: Date | null // required
  UT?: number | null // float required
}

/**
 * Parametros recibidos por SelectedObservationForm
 * @interface SelectedObservationForm
 */
interface SelectedObservationFormProps {
  /**
   * Identificador de caja delimitadora de observacion.
   * Si undefined entonces el componente que aplica la interfaz no
   * muestra nada.
   */
  boxId?: string
  /** Diccionario de metadatos relacionados a cada observación*/
  metadataDict: Record<string, BoxMetadata>
  /** Funcion para modificar diccionario de metadatos */
  setMetadataDict: Dispatch<SetStateAction<Record<string, BoxMetadata>>>
}

/**
 * Componente que muestra un formulario que permite editar algunos campos
 * relecionados a una observacion.
 */
export function SelectedObservationForm({
  boxId,
  metadataDict,
  setMetadataDict,
}: SelectedObservationFormProps) {
  /**
   * Diccionario que indica para cada metadato si esta "perdido" o no.
   * Cuando un metadato esta marcado como perdido significa que el
   * usuario no conoce su valor (null).
   * No confundir con "" (vacio, undefined) es distinto el que el usuario
   * no haya indicado nada que el que el usuario haya indicado que el
   * metadato esta perdido.
   * @default - Chequea si cada metadato tiene el valor null, en caso
   * positivo es marcado como perdido caso contrario el booleano es falso.
   */
  const [missings, setMissings] = useState<{
    OBJECT: boolean
    DATE_OBS: boolean
    UT: boolean
  }>({
    OBJECT: metadataDict[boxId!]?.OBJECT === null,
    DATE_OBS: metadataDict[boxId!]?.DATE_OBS === null,
    UT: metadataDict[boxId!]?.UT === null,
  })

  const { register, watch, trigger, reset, control, getValues, setValue, handleSubmit, formState } =
    useForm<FormData>({
      resolver: zodResolver(boxMetadataFormSchema), // Conectar Zod con React Hook Form
      mode: "onChange",
      defaultValues: metadataDict[boxId!],
    })

  /** Ante cualquier cambio los datos son guardados */
  useEffect(() => {
    const sub = watch((data) => {
      handleSubmit(handleSave)()
    })
    return () => sub.unsubscribe()
  }, [watch, handleSubmit])

  /** Si cambia un valor de missing entonces se fuerza un guardado*/
  useEffect(() => {
    handleSubmit(handleSave)()
  }, [missings, handleSubmit])

  /**
   * Si no hay un boxId entonces no se muestra nada del componente.
   * Condicional escencial que permite mandar el componente como hijo
   * que se clonara en un componente padre, de esta forma no es necesario
   * indicar parametros para el hijo.
   */
  if (!boxId) return <></>
  /** Si el dicionario de metadatos no conoce el boxId no devuelve nada. */
  if (!metadataDict[boxId]) return <></>

  /**
   * Funcion que se ejecuta cada que el usuario actualiza el
   * formulario. Si cambio un metadato entonces actuliza su valor.
   * Si alguno tiene la casilla MISSING que le corresponde marcada
   * entonces guarda null en su respectivo valor.
   */
  function handleSave(data: BoxMetadata) {
    if (
      data.OBJECT === metadataDict[boxId!].OBJECT &&
      data.DATE_OBS === metadataDict[boxId!].DATE_OBS &&
      data.UT === metadataDict[boxId!].UT
    )
      return

    const newDict = Object.fromEntries(
      Object.entries(metadataDict).map(([key, metadata]) =>
        key === boxId ? [boxId, data] : [key, metadata],
      ),
    )

    setMetadataDict(newDict)
  }

  return (
    <div className="flex justify-between">
      <div id="FieldObject" className="flex flex-col w-full max-w-xs gap-1.5">
        <div className="items-center">
          <Label>OBJECT</Label>
          <Input
            {...register("OBJECT", {
              setValueAs: (value) => (value === "" ? undefined : value),
            })}
            placeholder="Name of the object observed"
            className="border p-2 rounded w-4/5"
            disabled={missings.OBJECT}
          />

          {formState.errors.OBJECT && missings.OBJECT && (
            <p className="text-red-500">{formState.errors.OBJECT.message}</p>
          )}
        </div>
        <div className="flex justify-start">
          <CustomCheckbox
            label="Missing"
            checked={missings.OBJECT}
            onChange={(checked) => {
              if (checked) {
                setValue("OBJECT", null) // Pone en null el campo enlazado
              } else {
                setValue("OBJECT", undefined) // Deja undefined
              }
              setMissings((prev) => ({ ...prev, OBJECT: checked }))
            }}
          />
        </div>
      </div>

      <div id="FieldDateObs" className="flex flex-col w-full max-w-xs gap-1.5">
        <div className="items-center">
          <Label>DATE-OBS</Label>
          <Controller
            name="DATE_OBS"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value ?? undefined}
                onChange={(date) => field.onChange(date ?? undefined)}
                placeholder="Local time"
                disabled={missings.DATE_OBS}
              />
            )}
          />
          {formState.errors.DATE_OBS && missings.DATE_OBS && (
            <p className="text-red-500">{formState.errors.DATE_OBS.message}</p>
          )}
        </div>
        <div className="flex justify-start">
          <CustomCheckbox
            label="Missing"
            checked={missings.DATE_OBS}
            onChange={(checked) => {
              if (checked) {
                setValue("DATE_OBS", null) // Pone en null el campo enlazado
              } else {
                setValue("DATE_OBS", undefined) // Deja undefined
              }
              setMissings((prev) => ({ ...prev, DATE_OBS: checked }))
            }}
          />
        </div>
      </div>

      <div id="FieldUt" className="flex flex-col w-full max-w-xs gap-1.5">
        <div className="items-center">
          <Label>UT (Universal Time)</Label>
          <Controller
            control={control}
            name="UT"
            render={({ field: { value, onChange } }) => (
              <TimePicker
                date={value ? new Date(value * 1000) : undefined}
                setDate={(date) => {
                  onChange(date ? date.getTime() / 1000 : undefined)
                }}
                disabled={missings.UT}
              />
            )}
          />
          {formState.errors.UT && missings.UT && (
            <p className="text-red-500">{formState.errors.UT.message}</p>
          )}
        </div>
        <div className="flex justify-start">
          <CustomCheckbox
            label="Missing"
            checked={missings.UT}
            onChange={(checked) => {
              if (checked) {
                setValue("UT", null) // Pone en null el campo enlazado
              } else {
                setValue("UT", undefined) // Deja undefined
              }
              setMissings((prev) => ({ ...prev, UT: checked }))
            }}
          />
        </div>
      </div>
    </div>
  )
}
