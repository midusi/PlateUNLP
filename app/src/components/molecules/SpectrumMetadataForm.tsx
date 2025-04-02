import type { z } from "zod"
import { spectrumMetadataFormSchema } from "@/lib/spectrumMetadataFormSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@radix-ui/react-label"
import { useImperativeHandle } from "react"
import { Controller, useForm } from "react-hook-form"
import { DatePicker } from "../atoms/datePicker"
import { Input } from "../atoms/input"
import { TimePicker } from "../atoms/timePicker"

export interface SpectrumMetadata {
  OBJECT: string // required
  DATE_OBS: Date // required
  TIME_OBS: number // time/timestamp
  MAIN_ID: string // required
  UT: number // float required
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

type FormData = z.infer<typeof spectrumMetadataFormSchema>

interface SpectrumMetadataFormProps {
  ref: any
}

export function SpectrumMetadataForm({ ref }: SpectrumMetadataFormProps) {
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
  }))

  const inputContainerClassName = "w-full max-w-xs items-center gap-1.5"
  const inputClassName = "border p-2 rounded"

  return (
    <>
      <form className="w-full max-w-7xl">
        <div className="flex flex-wrap justify-center content-normal gap-4">
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
                  placeholder="Local time at the start of the observation"
                />
              )}
            />
            {errors.DATE_OBS && <p className="text-red-500">{errors.DATE_OBS.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>TIME-OBS</Label>
            <Controller
              control={control}
              name="TIME_OBS"
              render={({ field: { value, onChange } }) => (
                <TimePicker
                  date={value ? new Date(value * 1000) : undefined}
                  setDate={date => onChange(date ? date.getTime() / 1000 : 0)}
                />
              )}
            />
            {errors.TIME_OBS && <p className="text-red-500">{errors.TIME_OBS.message}</p>}
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
          <div className={inputContainerClassName}>
            <Label>ST</Label>
            <Input
              {...register("ST", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Local mean sidereal time"
              className={inputClassName}
            />
            {errors.ST && <p className="text-red-500">{errors.ST.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>HA</Label>
            <Input
              {...register("HA", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Hour angle"
              className={inputClassName}
            />
            {errors.HA && <p className="text-red-500">{errors.HA.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>RA</Label>
            <Input
              {...register("RA", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Right ascension"
              className={inputClassName}
            />
            {errors.RA && <p className="text-red-500">{errors.RA.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>DEC</Label>
            <Input
              placeholder="Declination"
              className={inputClassName}
              {...register("DEC", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
            />
            {errors.DEC && <p className="text-red-500">{errors.DEC.message}</p>}
          </div>

          <div className={inputContainerClassName}>
            <Label>GAIN</Label>
            <Input
              {...register("GAIN", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="GAIN"
              className={inputClassName}
            />
            {errors.GAIN && <p className="text-red-500">{errors.GAIN.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>RA2000</Label>
            <Input
              {...register("RA2000", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Right ascension J2000"
              className={inputClassName}
            />
            {errors.RA2000 && <p className="text-red-500">{errors.RA2000.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>DEC2000</Label>
            <Input
              {...register("DEC2000", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Declination J2000"
              className={inputClassName}
            />
            {errors.DEC2000 && <p className="text-red-500">{errors.DEC2000.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>RA1950</Label>
            <Input
              {...register("RA1950", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="RA2000 precessed ep.1950 eq.1950"
              className={inputClassName}
            />
            {errors.RA1950 && <p className="text-red-500">{errors.RA1950.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>DEC1950</Label>
            <Input
              {...register("DEC1950", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="DEC2000 precessed to ep.1950 eq.1950"
              className={inputClassName}
            />
            {errors.DEC1950 && <p className="text-red-500">{errors.DEC1950.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>EXPTIME (Integration time)</Label>
            <Controller
              control={control}
              name="EXPTIME"
              render={({ field: { value, onChange } }) => (
                <TimePicker
                  date={value ? new Date(value * 1000) : undefined}
                  setDate={date => onChange(date ? date.getTime() / 1000 : 0)}
                />
              )}
            />
            {errors.EXPTIME && <p className="text-red-500">{errors.EXPTIME.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>DETECTOR</Label>
            <Input
              {...register("DETECTOR")}
              placeholder="DETECTOR"
              className={inputClassName}
            />
            {errors.DETECTOR && <p className="text-red-500">{errors.DETECTOR.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>IMAGETYP</Label>
            <Input
              {...register("IMAGETYP")}
              placeholder="IMAGETYP"
              className={inputClassName}
            />
            {errors.IMAGETYP && <p className="text-red-500">{errors.IMAGETYP.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>SPTYPE</Label>
            <Input
              {...register("SPTYPE")}
              placeholder="Simbad spectral type"
              className={inputClassName}
            />
            {errors.SPTYPE && <p className="text-red-500">{errors.SPTYPE.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>JD</Label>
            <Input
              {...register("JD", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Geocentric Julian day (Greenwich)"
              className={inputClassName}
            />
            {errors.JD && <p className="text-red-500">{errors.JD.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>EQUINOX</Label>
            <Input
              {...register("EQUINOX", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="EQUINOX of ra y dec"
              className={inputClassName}
            />
            {errors.EQUINOX && <p className="text-red-500">{errors.EQUINOX.message}</p>}
          </div>
          <div className={inputContainerClassName}>
            <Label>AIRMASS</Label>
            <Input
              {...register("AIRMASS", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="AIRMASS"
              className={inputClassName}
            />
            {errors.AIRMASS && <p className="text-red-500">{errors.AIRMASS.message}</p>}
          </div>
        </div>
      </form>
    </>
  )
}
