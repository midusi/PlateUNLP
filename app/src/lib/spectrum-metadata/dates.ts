import type { GetSpectrumMetadataInput } from "./schema"
import { UTCDate } from "@date-fns/utc"
import { z } from "zod"

/**
 * Gets the full date and time of the observation, expressed in UT1.
 * @param input The input containing the date and time of observation, expressed in UT1.
 * @returns a {@link UTCDate}, approximated as UTC = UT1.
 */
function getFullDate(input: Pick<GetSpectrumMetadataInput, "DATE-OBS" | "UT">) {
  return new UTCDate(`${input["DATE-OBS"]}T${input.UT}Z`)
}

/**
 * Gets the Julian date. Works only for dates between 1801 and 2099 inclusive.
 * @param date The Gregorian calendar date, in the format YYYY-MM-DD.
 * @param time The UT1 time of day, in the format HH:MM:SS.
 * @return the fractional Julian Date.
 * @see {@link https://aa.usno.navy.mil/faq/JD_formula}.
 */
export function getJulianDate(date: string, time: string) {
  const [year, month, day] = z.iso.date().parse(date).split("-").map(n => Number.parseInt(n, 10))
  const [hour, minutes, seconds] = z.iso.time({ precision: 0 }).parse(time).split(":").map(n => Number.parseInt(n, 10))
  const UT = hour + minutes / 60 + seconds / 3600

  // All Math.trunc() are of the form Math.trunc(x/y) (integer division)
  return 367 * year
    - Math.trunc((7 * (year + Math.trunc((month + 9) / 12))) / 4)
    + Math.trunc(275 * month / 9)
    + day + 1721013.5
    + UT / 24
    - 0.5 * Math.sign(100 * year + month - 190002.5)
    + 0.5
}

/**
 * Gets the Julian epoch of a Julian date.
 * @param jd The Julian date as a float.
 * @returns The Julian epoch, in the format JYYYY.YY
 */
export function getJulianEpoch(jd: number) {
  /* Alternative implementation without computing the Julian date
  // Since ΔT = TT - UT1 ≈ 60 secs, we'll use UTC≈UT1 instead of TT.
  // This is a good approximation for the data range of interest (1800-2100).
  const date = getFullDate(input)
  const J2000 = new UTCDate("2000-01-01T12:00:00Z")
  // Each Julian year is exactly 365.25 days of 24 hours (of SI seconds).
  const epoch = 2000.0 + differenceInHours(date, J2000) / (24 * 365.25) */

  const epoch = 2000 + (jd - 2451545) / 365.25
  return `J${epoch.toFixed(2)}`
}

/**
 * Gets the Besselian epoch of a Julian date.
 * @param jd The Julian date as a float.
 * @returns The Besselian epoch, in the format BYYYY.YY
 */
export function getBesselianEpoch(jd: number) {
  const epoch = 1900 + (jd - 2415020.31352) / 365.242198781
  return `B${epoch.toFixed(2)}`
}
