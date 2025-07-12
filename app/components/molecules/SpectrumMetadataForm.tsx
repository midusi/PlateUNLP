import { zodResolver } from "@hookform/resolvers/zod"
import { type Dispatch, type SetStateAction, useEffect, useImperativeHandle, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"
import { Label } from "~/components/atoms/label"
import { spectrumMetadataFormSchema } from "~/lib/spectrumMetadataFormSchema"
import { Input } from "../atoms/input"
import { TimePicker } from "../atoms/timePicker"

export interface SpectrumMetadata {
  MAIN_ID: string // required
  TIME_OBS: number // time/timestamp
  ST: number // float
  HA: number // float
  RA: number // float (grados o radianes)
  DEC: number // float (grados o radianes)
  GAIN: number // float
  RA2000: number // float (grados o radianes)
  DEC2000: number // float (grados o radianes)
  RA1950: number // float (grados o radianes)
  DEC1950: number // float (grados o radianes)
  EXPTIME: number // float (segundos) / timestamp
  DETECTOR: string
  IMAGETYP: string
  SPTYPE: string
  JD: number // float
  EQUINOX: number // float
  AIRMASS: number
}
interface IconType {
  icon: string
  className: string
}
export interface SpectrumMetadataIcons {
  MAIN_ID: IconType
  TIME_OBS: IconType
  ST: IconType
  HA: IconType
  RA: IconType
  DEC: IconType
  GAIN: IconType
  RA2000: IconType
  DEC2000: IconType
  RA1950: IconType
  DEC1950: IconType
  EXPTIME: IconType
  DETECTOR: IconType
  IMAGETYP: IconType
  SPTYPE: IconType
  JD: IconType
  EQUINOX: IconType
  AIRMASS: IconType
}

type FormData = z.infer<typeof spectrumMetadataFormSchema>

/**
 * Parametros que espera recibir el componente SpectrumMetadataForm.
 * @interface SpectrumMetadataForm
 */
interface SpectrumMetadataFormProps {
  /** Referencia a enlazar al formulario para su uso desde mas arriba */
  ref: RefObject<{
    setValues: (spectrumMetadata: SpectrumMetadata) => void
    resetValues: () => void
    getValues: () => SpectrumMetadata
    validate: () => boolean
    setIcons: (icons: SpectrumMetadataIcons) => void
    getIcons: () => SpectrumMetadataIcons
  } | null>
  /** Funcion para reportar a componente superior si el formulario es valido o no. */
  setValidForm: Dispatch<SetStateAction<boolean>>
}

/**
 * Componente que muestra un formulario con entradas para todos los
 * metadatos que son comunes a una observación.
 */
export function SpectrumMetadataForm({ ref, setValidForm }: SpectrumMetadataFormProps) {
  const {
    register,
    watch,
    trigger,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(spectrumMetadataFormSchema), // Conectar Zod con React Hook Form
    mode: "onChange",
  })

  /** Actualiza variable de valides del padre */
  useEffect(() => {
    setValidForm(isValid)
  }, [isValid])

  const [spectrumMetadataIcons, setSpectrumMetadataIcons] = useState<SpectrumMetadataIcons>({
    MAIN_ID: { icon: "", className: "" },
    TIME_OBS: { icon: "", className: "" },
    ST: { icon: "", className: "" },
    HA: { icon: "", className: "" },
    RA: { icon: "", className: "" },
    DEC: { icon: "", className: "" },
    GAIN: { icon: "", className: "" },
    RA2000: { icon: "", className: "" },
    DEC2000: { icon: "", className: "" },
    RA1950: { icon: "", className: "" },
    DEC1950: { icon: "", className: "" },
    EXPTIME: { icon: "", className: "" },
    DETECTOR: { icon: "", className: "" },
    IMAGETYP: { icon: "", className: "" },
    SPTYPE: { icon: "", className: "" },
    JD: { icon: "", className: "" },
    EQUINOX: { icon: "", className: "" },
    AIRMASS: { icon: "", className: "" },
  })

  useImperativeHandle(ref, () => ({
    setValues: (spectrumMetadata: SpectrumMetadata) => {
      reset(spectrumMetadata)
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
    setIcons: (icons: SpectrumMetadataIcons) => {
      setSpectrumMetadataIcons(icons)
    },
    getIcons: () => {
      return spectrumMetadataIcons
    },
  }))

  const inputContainerClassName = "w-full max-w-xs items-center gap-1.5"
  const inputClassName = "border p-2 rounded"

  return (
    <>
      <form className="w-full max-w-7xl">
        <div className="flex flex-wrap justify-center content-normal gap-4">
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>MAIN-ID</Label>
              {spectrumMetadataIcons.MAIN_ID.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.MAIN_ID.icon}.png`}
                  className={spectrumMetadataIcons.MAIN_ID.className}
                />
              )}
            </div>
            <Input
              {...register("MAIN_ID")}
              placeholder="Simbad main ID object name"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  MAIN_ID: { icon: "", className: "" },
                })
              }}
            />
            {errors.MAIN_ID && <p className="text-red-500">{errors.MAIN_ID.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>TIME-OBS</Label>
              {spectrumMetadataIcons.TIME_OBS.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.TIME_OBS.icon}.png`}
                  className={spectrumMetadataIcons.TIME_OBS.className}
                />
              )}
            </div>
            <Controller
              control={control}
              name="TIME_OBS"
              render={({ field: { value, onChange } }) => (
                <TimePicker
                  date={value ? new Date(value * 1000) : undefined}
                  setDate={(date) => onChange(date ? date.getTime() / 1000 : 0)}
                  onChange={() => {
                    setSpectrumMetadataIcons({
                      ...spectrumMetadataIcons,
                      TIME_OBS: { icon: "", className: "" },
                    })
                  }}
                />
              )}
            />
            {errors.TIME_OBS && <p className="text-red-500">{errors.TIME_OBS.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>ST</Label>
              {spectrumMetadataIcons.ST.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.ST.icon}.png`}
                  className={spectrumMetadataIcons.ST.className}
                />
              )}
            </div>
            <Input
              {...register("ST", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="Local mean sidereal time"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  ST: { icon: "", className: "" },
                })
              }}
            />
            {errors.ST && <p className="text-red-500">{errors.ST.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>HA</Label>
              {spectrumMetadataIcons.HA.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.HA.icon}.png`}
                  className={spectrumMetadataIcons.HA.className}
                />
              )}
            </div>
            <Input
              {...register("HA", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="Hour angle"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  HA: { icon: "", className: "" },
                })
              }}
            />
            {errors.HA && <p className="text-red-500">{errors.HA.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>RA</Label>
              {spectrumMetadataIcons.RA.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.RA.icon}.png`}
                  className={spectrumMetadataIcons.RA.className}
                />
              )}
            </div>
            <Input
              {...register("RA", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="Right ascension"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  RA: { icon: "", className: "" },
                })
              }}
            />
            {errors.RA && <p className="text-red-500">{errors.RA.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>DEC</Label>
              {spectrumMetadataIcons.DEC.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.DEC.icon}.png`}
                  className={spectrumMetadataIcons.DEC.className}
                />
              )}
            </div>
            <Input
              placeholder="Declination"
              className={inputClassName}
              {...register("DEC", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  DEC: { icon: "", className: "" },
                })
              }}
            />
            {errors.DEC && <p className="text-red-500">{errors.DEC.message}</p>}
          </div>

          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>GAIN</Label>
              {spectrumMetadataIcons.GAIN.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.GAIN.icon}.png`}
                  className={spectrumMetadataIcons.GAIN.className}
                />
              )}
            </div>
            <Input
              {...register("GAIN", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="GAIN"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  GAIN: { icon: "", className: "" },
                })
              }}
            />
            {errors.GAIN && <p className="text-red-500">{errors.GAIN.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>RA2000</Label>
              {spectrumMetadataIcons.RA2000.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.RA2000.icon}.png`}
                  className={spectrumMetadataIcons.RA2000.className}
                />
              )}
            </div>
            <Input
              {...register("RA2000", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="Right ascension J2000"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  RA2000: { icon: "", className: "" },
                })
              }}
            />
            {errors.RA2000 && <p className="text-red-500">{errors.RA2000.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>DEC2000</Label>
              {spectrumMetadataIcons.DEC2000.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.DEC2000.icon}.png`}
                  className={spectrumMetadataIcons.DEC2000.className}
                />
              )}
            </div>
            <Input
              {...register("DEC2000", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="Declination J2000"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  DEC2000: { icon: "", className: "" },
                })
              }}
            />
            {errors.DEC2000 && <p className="text-red-500">{errors.DEC2000.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>RA1950</Label>
              {spectrumMetadataIcons.RA1950.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.RA1950.icon}.png`}
                  className={spectrumMetadataIcons.RA1950.className}
                />
              )}
            </div>
            <Input
              {...register("RA1950", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="RA2000 precessed ep.1950 eq.1950"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  RA1950: { icon: "", className: "" },
                })
              }}
            />
            {errors.RA1950 && <p className="text-red-500">{errors.RA1950.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>DEC1950</Label>
              {spectrumMetadataIcons.DEC1950.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.DEC1950.icon}.png`}
                  className={spectrumMetadataIcons.DEC1950.className}
                />
              )}
            </div>
            <Input
              {...register("DEC1950", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="DEC2000 precessed to ep.1950 eq.1950"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  DEC1950: { icon: "", className: "" },
                })
              }}
            />
            {errors.DEC1950 && <p className="text-red-500">{errors.DEC1950.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>EXPTIME (Integration time)</Label>
              {spectrumMetadataIcons.EXPTIME.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.EXPTIME.icon}.png`}
                  className={spectrumMetadataIcons.EXPTIME.className}
                />
              )}
            </div>
            <Controller
              control={control}
              name="EXPTIME"
              render={({ field: { value, onChange } }) => (
                <TimePicker
                  date={value ? new Date(value * 1000) : undefined}
                  setDate={(date) => onChange(date ? date.getTime() / 1000 : 0)}
                  onChange={() => {
                    setSpectrumMetadataIcons({
                      ...spectrumMetadataIcons,
                      EXPTIME: { icon: "", className: "" },
                    })
                  }}
                />
              )}
            />
            {errors.EXPTIME && <p className="text-red-500">{errors.EXPTIME.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>DETECTOR</Label>
              {spectrumMetadataIcons.DETECTOR.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.DETECTOR.icon}.png`}
                  className={spectrumMetadataIcons.DETECTOR.className}
                />
              )}
            </div>
            <Input
              {...register("DETECTOR")}
              placeholder="DETECTOR"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  DETECTOR: { icon: "", className: "" },
                })
              }}
            />
            {errors.DETECTOR && <p className="text-red-500">{errors.DETECTOR.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>IMAGETYP</Label>
              {spectrumMetadataIcons.IMAGETYP.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.IMAGETYP.icon}.png`}
                  className={spectrumMetadataIcons.IMAGETYP.className}
                />
              )}
            </div>
            <Input
              {...register("IMAGETYP")}
              placeholder="IMAGETYP"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  IMAGETYP: { icon: "", className: "" },
                })
              }}
            />
            {errors.IMAGETYP && <p className="text-red-500">{errors.IMAGETYP.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>SPTYPE</Label>
              {spectrumMetadataIcons.SPTYPE.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.SPTYPE.icon}.png`}
                  className={spectrumMetadataIcons.SPTYPE.className}
                />
              )}
            </div>
            <Input
              {...register("SPTYPE")}
              placeholder="Simbad spectral type"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  SPTYPE: { icon: "", className: "" },
                })
              }}
            />
            {errors.SPTYPE && <p className="text-red-500">{errors.SPTYPE.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>JD</Label>
              {spectrumMetadataIcons.JD.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.JD.icon}.png`}
                  className={spectrumMetadataIcons.JD.className}
                />
              )}
            </div>
            <Input
              {...register("JD", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="Geocentric Julian day (Greenwich)"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  JD: { icon: "", className: "" },
                })
              }}
            />
            {errors.JD && <p className="text-red-500">{errors.JD.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>EQUINOX</Label>
              {spectrumMetadataIcons.EQUINOX.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.EQUINOX.icon}.png`}
                  className={spectrumMetadataIcons.EQUINOX.className}
                />
              )}
            </div>
            <Input
              {...register("EQUINOX", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="EQUINOX of ra y dec"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  EQUINOX: { icon: "", className: "" },
                })
              }}
            />
            {errors.EQUINOX && <p className="text-red-500">{errors.EQUINOX.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <div className="flex items-center justify-between">
              <Label>AIRMASS</Label>
              {spectrumMetadataIcons.AIRMASS.icon != "" && (
                <img
                  src={`/public/icons/${spectrumMetadataIcons.AIRMASS.icon}.png`}
                  className={spectrumMetadataIcons.AIRMASS.className}
                />
              )}
            </div>
            <Input
              {...register("AIRMASS", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value),
              })}
              placeholder="AIRMASS"
              className={inputClassName}
              onChange={() => {
                setSpectrumMetadataIcons({
                  ...spectrumMetadataIcons,
                  AIRMASS: { icon: "", className: "" },
                })
              }}
            />
            {errors.AIRMASS && <p className="text-red-500">{errors.AIRMASS.message}</p>}
          </div>
        </div>
      </form>
    </>
  )
}
