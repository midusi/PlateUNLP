import { TZDate } from "@date-fns/tz"
import { UTCDate } from "@date-fns/utc"
import { formatDate } from "date-fns"
import { FITS } from "fits2js"
import { normalizeLocalDateTime } from "../local-datetime"

const BLANK_LENGTH = 80 - 8

/** Append a section header card with a dash-padded title (e.g. `"Plate metadata ----..."`). */
export function appendSectionBanner(fits: FITS, title: string) {
  fits.header.appendBlank(`${title} `.padEnd(BLANK_LENGTH, "-"))
}

export function setIfPresent(
  fits: FITS,
  keyword: string,
  value: string | undefined,
  comment: string,
) {
  if (!value) return
  fits.header.set(keyword, value, { comment })
}

export function setTextCard(
  fits: FITS,
  keyword: string,
  value: string | undefined,
  comment: string,
) {
  fits.header.set(keyword, value ?? "", { comment })
}

export function setNumericIfPresent(
  fits: FITS,
  keyword: string,
  value: string | undefined,
  comment: string,
) {
  if (!value) return
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) return
  fits.header.set(keyword, numeric, { comment })
}

export function setExposureTimeIfPresent(fits: FITS, value: string | undefined) {
  if (!value) return
  const seconds = parseExposureTimeSeconds(value)
  if (seconds === undefined) return
  fits.header.set("EXPTIME", seconds, { comment: "[s] exposure time" })
}

export function fromUint16Array(points: Uint16Array, axes: number[]): FITS {
  const signedPoints = new Int16Array(points.length)
  for (let i = 0; i < points.length; i++) {
    signedPoints[i] = points[i]! - 32768
  }

  const fits = FITS.fromTypedArray(signedPoints, 16, axes)
  fits.header.set("BSCALE", 1, {
    comment: "physical_value = BZERO + BSCALE * array_value",
  })
  fits.header.set("BZERO", 32768, {
    comment: "physical_value = BZERO + BSCALE * array_value",
  })
  return fits
}

export function assertPixelCount(length: number, width: number, height: number) {
  if (length !== width * height) {
    throw new RangeError(`Expected ${width * height} pixels, but got ${length}`)
  }
}

export function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export function normalizeOptionalDateTime(value: string | undefined) {
  return value ? normalizeLocalDateTime(value) : undefined
}

function parseExposureTimeSeconds(value: string): number | undefined {
  const numeric = Number.parseFloat(value)
  if (Number.isFinite(numeric)) return numeric

  const match =
    /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(
      value,
    )
  if (!match) return undefined

  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match
  return (
    Number.parseFloat(days) * 86400 +
    Number.parseFloat(hours) * 3600 +
    Number.parseFloat(minutes) * 60 +
    Number.parseFloat(seconds)
  )
}

export function derivePixelSizeFromScanResolution(value: string | undefined) {
  if (!value) return undefined
  const dpi = Number.parseFloat(value)
  if (!Number.isFinite(dpi) || dpi <= 0) return undefined
  return (25400 / dpi).toString()
}

export function toLocalObservationDateTime(
  value: string | undefined,
  timezone: string | undefined,
) {
  if (!value || !timezone) return undefined

  try {
    const utcDate = new UTCDate(`${normalizeLocalDateTime(value)}Z`)
    return formatDate(new TZDate(utcDate, timezone), "yyyy-MM-dd'T'HH:mm:ss")
  } catch {
    return undefined
  }
}

export function inferRadesys(metadata: {
  ra?: string
  dec?: string
  equinox?: string
  ra2000?: string
  dec2000?: string
}) {
  if (metadata.ra || metadata.dec || metadata.equinox || metadata.ra2000 || metadata.dec2000) {
    return "FK4"
  }
  return undefined
}

export function toFITSDateTimeString(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "")
}

export function toASCIIHeaderString(value: string | undefined) {
  if (!value) return ""
  return value
    .normalize("NFD") // Split accented letters into base letter + combining mark, e.g. "á" -> "a" + accent.
    .replace(/[\u0300-\u036f]/g, "") // Remove the combining marks so accented Latin letters become plain ASCII letters.
    .replace(/[^\x20-\x7E]/g, "") // Drop any remaining character outside printable ASCII, which FITS headers require.
}
