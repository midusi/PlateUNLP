import { createServerFn } from "@tanstack/react-start"
import { createError } from "evlog"
import { z } from "zod"
import { db } from "~/db"
import {
  getJulianDate,
  getJulianEpoch,
  getLocalDateTime,
  getSiderealTime,
} from "~/lib/astronomical/datetime"
import { equatorialToHorizontal, getAirmass, getHourAngle } from "~/lib/astronomical/misc"
import { queryObjectById } from "~/lib/astronomical/simbad"
import { degToDMS, degToHMS } from "~/lib/format"
import { splitLocalDateTime } from "~/lib/local-datetime"
import { log } from "~/lib/log"
import { ObservationMetadataSchema, PlateMetadataSchema } from "~/types/spectrum-metadata"

async function getDeltaT(mdj: number): Promise<number | null> {
  const [left, right] = await Promise.all([
    db.query.iersDeltaT.findFirst({
      where: (t, { lte }) => lte(t.mdj, mdj),
      orderBy: (t, { desc }) => [desc(t.mdj)],
    }),
    db.query.iersDeltaT.findFirst({
      where: (t, { gt }) => gt(t.mdj, mdj),
      orderBy: (t, { asc }) => [asc(t.mdj)],
    }),
  ])

  if (!left || !right) return null
  // Linear interpolation between left and right
  return left.deltaT + ((right.deltaT - left.deltaT) * (mdj - left.mdj)) / (right.mdj - left.mdj)
}

async function getPolarMotion(mdj: number): Promise<{ status: -1 | 0 | 1; x: number; y: number }> {
  const [left, right] = await Promise.all([
    db.query.iersBulletinA.findFirst({
      where: (t, { lte }) => lte(t.mdj, mdj),
      orderBy: (t, { desc }) => [desc(t.mdj)],
    }),
    db.query.iersBulletinA.findFirst({
      where: (t, { gt }) => gt(t.mdj, mdj),
      orderBy: (t, { asc }) => [asc(t.mdj)],
    }),
  ])

  if (!left || !right) {
    // Use the mean of the 1962-2014 IERS B data
    return {
      status: !left ? -1 : +1,
      x: 0.035,
      y: 0.29,
    }
  }

  // Linear interpolation between left and right
  const t = (mdj - left.mdj) / (right.mdj - left.mdj)
  return {
    status: 0,
    x: left.pmX + (right.pmX - left.pmX) * t,
    y: left.pmY + (right.pmY - left.pmY) * t,
  }
}

export const computeObservationMetadata = createServerFn()
  .validator(
    z.object({
      ...PlateMetadataSchema.pick({ OBSERVAT: true }).shape,
      ...ObservationMetadataSchema.pick({ OBJECT: true, "DATE-OBS": true }).shape,
    }),
  )
  .handler(async ({ data }) => {
    log().set({ compute: { object: data.OBJECT, observatory: data.OBSERVAT } })
    if (!data["DATE-OBS"].isKnown)
      throw createError({
        message: "DATE-OBS is required",
        status: 400,
        why: "Computing derived metadata needs a known observation datetime",
        fix: "Set DATE-OBS and mark it as known before computing",
      })
    const { date, time } = splitLocalDateTime(data["DATE-OBS"].value)
    // JD, EPOCH, EQUINOX
    const JD = getJulianDate(date, time)
    const EPOCH = getJulianEpoch(JD)
    const EQUINOX = EPOCH.slice(1) // Remove leading "J" from the epoch string
    // MAIN-ID, SPTYPE, RA, DEC, RA2000, DEC2000, RA1950, DEC1950
    const simbad = await queryObjectById(data.OBJECT, EPOCH, EQUINOX)
    if (simbad.isErr())
      throw createError({
        message: "SIMBAD lookup failed",
        status: 502,
        why: simbad.error.message,
        fix: "Check that the OBJECT name resolves in SIMBAD",
      })
    log().set({ simbad: { mainId: simbad.value["MAIN-ID"] } })

    // Get observatory data (latitude, longitude and timezone)
    const observatory = await db.query.observatory.findFirst({
      where: (observatory, { eq }) => eq(observatory.id, data.OBSERVAT),
    })
    if (!observatory)
      throw createError({
        message: "Observatory not found",
        status: 404,
        why: `No observatory with id ${data.OBSERVAT}`,
        fix: "Select a valid observatory in the plate metadata",
      })

    // DATE-ORG
    const DATE_ORG = getLocalDateTime(date, time, observatory.timezone)
    const ST = await getSiderealTime(
      JD,
      observatory.longitude,
      (mjd) => getDeltaT(mjd),
      (mjd) => getPolarMotion(mjd),
    )
    if (ST.isErr())
      throw createError({
        message: "Sidereal time computation failed",
        status: 500,
        why: ST.error.message,
        fix: "Verify the observation datetime and observatory coordinates",
      })
    const HA = getHourAngle(simbad.value.RA2000, ST.value)
    const { azimuth } = equatorialToHorizontal(HA, simbad.value.DEC2000, observatory.latitude)
    const AIRMASS = getAirmass(azimuth)
    return {
      OBJECT: data.OBJECT,
      "DATE-OBS": data["DATE-OBS"],
      "MAIN-ID": { value: simbad.value["MAIN-ID"], isKnown: true },
      SPTYPE: { value: simbad.value.SPTYPE ?? "", isKnown: true },
      RA: { value: degToHMS(simbad.value.RA2000), isKnown: true },
      DEC: { value: degToDMS(simbad.value.DEC2000), isKnown: true },
      EQUINOX: { value: EQUINOX, isKnown: true },
      RA2000: { value: degToHMS(simbad.value.RA2000), isKnown: true },
      DEC2000: { value: degToDMS(simbad.value.DEC2000), isKnown: true },
      RA1950: { value: degToHMS(simbad.value.RA1950), isKnown: true },
      DEC1950: { value: degToDMS(simbad.value.DEC1950), isKnown: true },
      "DATE-ORG": { value: DATE_ORG, isKnown: true },
      JD: { value: JD.toFixed(4), isKnown: true },
      ST: { value: degToHMS(ST.value), isKnown: true },
      HA: { value: degToDMS(HA), isKnown: true },
      AIRMASS: { value: AIRMASS.toString(), isKnown: true },
    } satisfies Partial<z.input<typeof ObservationMetadataSchema>>
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
