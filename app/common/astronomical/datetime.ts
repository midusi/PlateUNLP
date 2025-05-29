/**
 * @fileoverview
 * This file contains functions to compute dates and times in multiple
 * formats (Julian, Besselian, UTC, UT1, etc.).
 *
 * {@link /docs/reference/astronomical/#datetime}
 */

import { TZDate } from "@date-fns/tz"
import { UTCDate } from "@date-fns/utc"
import { formatDate } from "date-fns"
import { err, ok, type Result, ResultAsync } from "neverthrow"
import { z } from "zod/v4"
import {
  type BigNumber,
  div,
  math,
  normalizeAngle,
  rotationMatrix3D,
} from "@/common/math"

const ARCSEC_TO_RAD = math.bignumber("4.848136811095359935899141e-6") // Arcseconds to radians
const DEG_TO_RAD = math.bignumber("1.745329251994329576923691e-2") // Degrees to radians
const RAD_TO_DEG = math.bignumber("57.29577951308232087679815") // Radians to degrees
const JD_CENTURY = 36525 // Days in a Julian century
const JD_J2000 = 2451545.0 // Reference epoch (J2000.0) as Julian date

/**
 * Gets the full date and time of a datetime, expressed in UT (≈UTC).
 * @param date The Gregorian calendar date, in the format YYYY-MM-DD.
 * @param ut The universal time time of day, in the format HH:MM:SS.
 * @returns a {@link UTCDate}.
 */
function getFullDate(date: string, ut: string) {
  return new UTCDate(`${date}T${ut}Z`)
}

/**
 * Gets the local time of the observation, according to the timezone.
 * @param date The Gregorian calendar date, in the format YYYY-MM-DD.
 * @param ut The UT (≈UTC) time of day, in the format HH:MM:SS.
 * @param tz The timezone of the observation, in the IANA TZ format (e.g. "America/Argentina/Buenos_Aires").
 * @returns the local time, in the format HH:MM:SS.
 * @see {@link /docs/reference/astronomical/#getlocaltime}
 */
export function getLocalTime(date: string, ut: string, tz: string) {
  const utcDate = getFullDate(date, ut)
  const localDate = new TZDate(utcDate, tz)
  return formatDate(localDate, "HH:mm:ss")
}

/**
 * Gets the Julian date.
 * @param date The Gregorian calendar date, in the format YYYY-MM-DD.
 * @param ut The UT (≈UTC) time of day, in the format HH:MM:SS.
 * @return the fractional Julian Date.
 * @see {@link /docs/reference/astronomical/#getjuliandate}
 */
export function getJulianDate(date: string, ut: string) {
  // Parameters for the Gregorian calendar (Table 15.14)
  const y = 4716,
    j = 1401,
    m = 2,
    n = 12,
    r = 4,
    p = 1461,
    q = 0,
    // v = 3,
    u = 5,
    s = 153,
    t = 2,
    // w = 2,
    A = 184,
    // B = 274277,
    C = -38

  const [Y, M, D] = z.iso
    .date()
    .parse(date)
    .split("-")
    .map((n) => Number.parseInt(n, 10))

  // Applying "Algorithm 3" from Urban and Seidelmann (2013)
  const h = M - m,
    g = Y + y - div(n - h, n),
    f = (h - 1 + n) % n,
    e = div(p * g + q, r) + D - 1 - j,
    J = e + div(s * f + t, u) - div(3 * div(g + A, 100), 4) - C

  const [hour, minutes, seconds] = z.iso
    .time({ precision: 0 })
    .parse(ut)
    .split(":")
    .map((n) => Number.parseInt(n, 10))

  // J is always an integer, so it's set to 12:00.
  const ΔT = math.divide(
    (hour - 12) * 60 * 60 + minutes * 60 + seconds,
    24 * 60 * 60,
  )
  return math.add(J, ΔT)
}

/**
 * Gets the Modified Julian date from a Julian date.
 * @param jd The Julian date as a float.
 * @returns the Modified Julian Date (MJD).
 */
export function getModifiedJulianDate(jd: number) {
  // Modified Julian Date (MJD) is JD - 2400000.5
  return math.subtract(jd, 2400000.5)
}

/**
 * Gets the Julian epoch of a Julian date.
 * @param jd The Julian date as a float.
 * @returns The Julian epoch, in the format JYYYY.YY
 */
export function getJulianEpoch(jd: number) {
  // 2000 + ((jd - 2451545) / 365.25)
  const epoch = math.chain(jd).subtract(2451545).divide(365.25).add(2000).done()
  return `J${epoch.toFixed(2)}`
}

/**
 * Gets the Besselian epoch of a Julian date.
 * @param jd The Julian date as a float.
 * @returns The Besselian epoch, in the format BYYYY.YY
 */
export function getBesselianEpoch(jd: number) {
  // 1900 + ((jd - 2415020.31352) / 365.242198781)
  const epoch = math
    .chain(jd)
    .subtract(2415020.31352)
    .divide(365.242198781)
    .add(1900)
    .done()
  return `B${epoch.toFixed(2)}`
}

/**
 * Gets the local sidereal time at a given moment.
 * @param jd The Julian date in UT (≈UTC).
 * @param long The longitude of the observer, in degrees (positive for East, negative for West).
 * @param getΔT A function that returns the ΔT (Delta T) value for the given Modified Julian Date (MJD).
 * @param getPolarMotion A function that returns the polar motion for the given Modified Julian Date (MJD).
 * @return the sidereal time in degrees.
 * @see {@link /docs/reference/astronomical/#getsiderealtime}
 */
export async function getSiderealTime(
  jd: number,
  long: number,
  getΔT: (mjd: number) => Promise<number | null>,
  getPolarMotion: (mjd: number) => Promise<{ x: number; y: number }>,
): Promise<Result<number, Error>> {
  const mjd = getModifiedJulianDate(jd)

  // Gets the Earth Rotation Angle (ERA) at the given date and time,
  // applying the "Equation 1" from Capitaine et al. (2003).
  const θ = normalizeAngle(
    math
      .bignumber(jd)
      .sub(JD_J2000)
      .mul("1.00273781191135448")
      .add("0.779057273264")
      .mul(math.tau),
  )

  // Now, we compute the Julian centuries since J2000.0 in TT
  const ΔT = await ResultAsync.fromPromise(
    getΔT(mjd),
    () => new Error("Couldn't get ΔT (Delta T) value"),
  )
  if (ΔT.isErr()) return err(ΔT.error)
  // ΔT is in seconds, so we convert it to days
  const daysΔT = math.divide(
    math.bignumber(ΔT.value),
    24 * 60 * 60,
  ) as BigNumber
  // t = (jd + ΔT - J2000) / JD_CENTURY
  const t = math.bignumber(jd).add(daysΔT).sub(JD_J2000).div(JD_CENTURY)

  // Now, according to the "Table 4" of Capitaine et al. (2005),
  // we can compute the Greenwich Mean Sidereal Time (GMST) from
  // the ERA and adding a few terms of t.
  let gmst = t.mul("-0.0000000368") // -0".0000000368*t⁵
  gmst = gmst.add("-0.000029956").mul(t) // -0".000029956*t⁴
  gmst = gmst.add("-0.00000044").mul(t) // -0".00000044*t³
  gmst = gmst.add("+1.3915817").mul(t) // +1".3915817*t²
  gmst = gmst.add("+4612.156534").mul(t) // +4612".156534*t
  gmst = gmst.add("+0.014506") // +0".014506

  // Now, convert it to radians and add the ERA to get the GMST
  gmst = normalizeAngle(math.add(θ, gmst.mul(ARCSEC_TO_RAD)))

  // Finished the computation described in Capitaine et al. (2005),
  // we now make a simple rotation from Greenwich to the observer's longitude.

  // Gets the polar motion values
  const pm = await ResultAsync.fromPromise(
    getPolarMotion(mjd),
    () => new Error("Couldn't get polar motion value from IERS service"),
  )
  if (pm.isErr()) return err(pm.error)

  // Computes the TIO locator s'
  const sp = t.mul("-47e-6").mul(ARCSEC_TO_RAD)

  // Rotates the GMST
  const r = math
    .chain(rotationMatrix3D(math.bignumber(long).mul(DEG_TO_RAD), "z"))
    .multiply(
      rotationMatrix3D(
        math.bignumber(pm.value.y).neg().mul(ARCSEC_TO_RAD),
        "x",
      ),
    )
    .multiply(
      rotationMatrix3D(
        math.bignumber(pm.value.x).neg().mul(ARCSEC_TO_RAD),
        "y",
      ),
    )
    .multiply(rotationMatrix3D(gmst.add(sp), "z"))
    .done()

  // atan2(y, x) gives us the angle in radians
  const atan = math.atan2(
    r.subset(math.index(0, 1)),
    r.subset(math.index(0, 0)),
  ) as unknown as BigNumber
  const st = normalizeAngle(atan)

  // Return the sidereal time in degrees
  return ok(math.number(st.mul(RAD_TO_DEG)))
}
