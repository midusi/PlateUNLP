import type { Result } from "neverthrow"
import { err, ok, ResultAsync } from "neverthrow"
import { z } from "zod/v4"
import {
  getJulianDate,
  getJulianEpoch,
  getLocalTime,
  getSiderealTime,
} from "~/lib/astronomical/datetime"
import { equatorialToHorizontal, getAirmass, getHourAngle } from "~/lib/astronomical/misc"
import { queryObjectById } from "~/lib/astronomical/simbad"
import { degToHMS } from "~/lib/format"
import { trpc } from "~/lib/trpc"

export async function getSpectrumMetadata(
  input: GetSpectrumMetadataInput,
): Promise<Result<void, Error>> {
  const { OBSERVAT, OBJECT, "DATE-OBS": DATE_OBS, UT } = input

  // JD, EPOCH, EQUINOX
  const JD = getJulianDate(DATE_OBS, UT)
  const EPOCH = getJulianEpoch(JD)
  const EQUINOX = EPOCH.slice(1) // Remove leading "J" from the epoch string
  // MAIN-ID, SPTYPE, RA, DEC, RA2000, DEC2000, RA1950, DEC1950
  const simbad = await queryObjectById(OBJECT, EPOCH, EQUINOX)
  if (simbad.isErr()) {
    return err(simbad.error)
  }
  // Get observatory data (latitude, longitude and timezone)
  const observatoryData = await ResultAsync.fromPromise(
    trpc.observatory.get.query(OBSERVAT),
    () => new Error("Couldn't get observatory data"),
  )
  if (observatoryData.isErr()) return err(observatoryData.error)
  if (!observatoryData.value) return err(new Error(`Observatory "${OBSERVAT}" wasn't found`))
  const obsLatitude = observatoryData.value.latitude
  const obsLongitude = observatoryData.value.longitude
  const obsTimezone = observatoryData.value.timezone
  // TIME-OBS
  const TIME_OBS = getLocalTime(DATE_OBS, UT, obsTimezone)
  const ST = await getSiderealTime(
    JD,
    obsLongitude,
    (mjd) => trpc.iers.getDeltaT.query(mjd),
    (mjd) => trpc.iers.getPolarMotion.query(mjd),
  )
  if (ST.isErr()) return err(ST.error)
  const HA = getHourAngle(simbad.value.RA2000, ST.value)
  const { altitude } = equatorialToHorizontal(HA, simbad.value.DEC2000, obsLatitude)
  const AIRMASS = getAirmass(altitude)
  console.log({
    simbad,
    ob: observatoryData.value,
    TIME_OBS,
    JD,
    ST: degToHMS(ST.value),
    HA: degToHMS(HA),
    AIRMASS,
  })
  return ok()
}

export const getSpectrumMetadataInputSchema = z.object({
  OBSERVAT: z.string().nonempty(),
  OBJECT: z.string().nonempty(),
  "DATE-OBS": z.string().nonempty(),
  UT: z.string().nonempty(),
})

export type GetSpectrumMetadataInput = z.infer<typeof getSpectrumMetadataInputSchema>

export const spectrumMetadataSchema = z.object({
  OBJECT: z.string().nonempty(),
  "DATE-OBS": z.iso.date(),
  UT: z.iso.time({ precision: 0 }),
  "TIME-OBS": z.iso.time().optional(),
  MAIN_ID: z.string().nonempty(),
  ST: z.union([z.undefined(), z.number()]),
  HA: z.union([z.undefined(), z.number()]),
  RA: z.union([z.undefined(), z.number()]),
  DEC: z.union([z.undefined(), z.number()]),
  GAIN: z.union([z.undefined(), z.number()]),
  RA2000: z.union([z.undefined(), z.number()]),
  DEC2000: z.union([z.undefined(), z.number()]),
  RA1950: z.union([z.undefined(), z.number()]),
  DEC1950: z.union([z.undefined(), z.number()]),
  EXPTIME: z.number().optional(),
  DETECTOR: z.string().optional(),
  IMAGETYP: z.string().optional(),
  SPTYPE: z.string().optional(),
  JD: z.union([z.undefined(), z.number()]),
  EQUINOX: z.union([z.undefined(), z.number()]),
  AIRMASS: z.union([z.undefined(), z.number()]),
})

/*
  OBJECT: $metadataStore.spectraData[bboxSelected - 2]["OBJECT"],
      OBSERVAT: $metadataStore.plateData["OBSERVAT"],
      "DATE-OBS": $metadataStore.spectraData[bboxSelected - 2]["DATE-OBS"],
      UT: $metadataStore.spectraData[bboxSelected - 2]["UT"],
      SUFFIX: $metadataStore.spectraData[bboxSelected - 2]["SUFFIX"],
  */

// http://tdc-www.harvard.edu/wcstools/wcstools.wcs.html
// RADECSYS     = 'FK4'
