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

export function SpectrumMetadataForm({ ref, ..._props }) {
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

  return (
    <>
      <form>
        <div className="flex flex-wrap content-normal gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>OBJECT</Label>
            <Input {...register("OBJECT")} placeholder="Name of the object observed" className="border p-2 rounded" />
            {errors.OBJECT && <p className="text-red-500">{errors.OBJECT.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>DATE-OBS</Label>
            <Controller
              name="DATE_OBS"
              control={control}
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} placeholder="Local time at the start of the observation" />
              )}
            />
            {errors.DATE_OBS && <p className="text-red-500">{errors.DATE_OBS.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
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
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>MAIN-ID</Label>
            <Input {...register("MAIN_ID")} placeholder="Simbad main ID object name" className="border p-2 rounded" />
            {errors.MAIN_ID && <p className="text-red-500">{errors.MAIN_ID.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
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
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>ST</Label>
            <Input
              {...register("ST", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Local mean sidereal time"
              className="border p-2 rounded"
            />
            {errors.ST && <p className="text-red-500">{errors.ST.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>HA</Label>
            <Input
              {...register("HA", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Hour angle"
              className="border p-2 rounded"
            />
            {errors.HA && <p className="text-red-500">{errors.HA.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>RA</Label>
            <Input
              {...register("RA", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Right ascension"
              className="border p-2 rounded"
            />
            {errors.RA && <p className="text-red-500">{errors.RA.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>DEC</Label>
            <Input
              placeholder="Declination"
              className="border p-2 rounded"
              {...register("DEC", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
            />
            {errors.DEC && <p className="text-red-500">{errors.DEC.message}</p>}
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>GAIN</Label>
            <Input
              {...register("GAIN", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="GAIN"
              className="border p-2 rounded"
            />
            {errors.GAIN && <p className="text-red-500">{errors.GAIN.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>RA2000</Label>
            <Input
              {...register("RA2000", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Right ascension J2000"
              className="border p-2 rounded"
            />
            {errors.RA2000 && <p className="text-red-500">{errors.RA2000.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>DEC2000</Label>
            <Input
              {...register("DEC2000", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Declination J2000"
              className="border p-2 rounded"
            />
            {errors.DEC2000 && <p className="text-red-500">{errors.DEC2000.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>RA1950</Label>
            <Input
              {...register("RA1950", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="RA2000 precessed ep.1950 eq.1950"
              className="border p-2 rounded"
            />
            {errors.RA1950 && <p className="text-red-500">{errors.RA1950.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>DEC1950</Label>
            <Input
              {...register("DEC1950", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="DEC2000 precessed to ep.1950 eq.1950"
              className="border p-2 rounded"
            />
            {errors.DEC1950 && <p className="text-red-500">{errors.DEC1950.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
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
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>DETECTOR</Label>
            <Input {...register("DETECTOR")} placeholder="DETECTOR" className="border p-2 rounded" />
            {errors.DETECTOR && <p className="text-red-500">{errors.DETECTOR.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>IMAGETYP</Label>
            <Input {...register("IMAGETYP")} placeholder="IMAGETYP" className="border p-2 rounded" />
            {errors.IMAGETYP && <p className="text-red-500">{errors.IMAGETYP.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>SPTYPE</Label>
            <Input {...register("SPTYPE")} placeholder="Simbad spectral type" className="border p-2 rounded" />
            {errors.SPTYPE && <p className="text-red-500">{errors.SPTYPE.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>JD</Label>
            <Input
              {...register("JD", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="Geocentric Julian day (Greenwich)"
              className="border p-2 rounded"
            />
            {errors.JD && <p className="text-red-500">{errors.JD.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>EQUINOX</Label>
            <Input
              {...register("EQUINOX", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="EQUINOX of ra y dec"
              className="border p-2 rounded"
            />
            {errors.EQUINOX && <p className="text-red-500">{errors.EQUINOX.message}</p>}
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label>AIRMASS</Label>
            <Input
              {...register("AIRMASS", {
                setValueAs: value => (value === "" ? undefined : Number.isNaN(value) ? Number.NaN : Number(value)),
              })}
              placeholder="AIRMASS"
              className="border p-2 rounded"
            />
            {errors.AIRMASS && <p className="text-red-500">{errors.AIRMASS.message}</p>}
          </div>
        </div>
      </form>
    </>
  )
}
