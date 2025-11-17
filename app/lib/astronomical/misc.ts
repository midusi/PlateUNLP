import { type BigNumber, DEG_TO_RAD, math, normalizeAngle, RAD_TO_DEG } from "~/lib/math"

/**
 * Calculate the local hour angle of a celestial object.
 * @param ra2000 right ascension in degrees (ICRS).
 * @param st local mean sidereal time in degrees.
 * @returns Hour angle in degrees.
 * @see {@link /docs/reference/astronomical/#gethourangle}
 */
export function getHourAngle(ra2000: number, st: number): number {
  return normalizeAngle(st - ra2000, "degrees")
}

/**
 * Equatorial to horizontal coordinates: transform hour angle and declination
 * to azimuth and altitude.
 * @param ha local hour angle in degrees.
 * @param dec2000 declination in degrees (ICRS).
 * @param lat latitude of the observer in degrees.
 * @return azimuth and altitude in degrees.
 * @see {@link /docs/reference/astronomical/#equatorialtohorizontal}
 */
export function equatorialToHorizontal(
  ha: number,
  dec2000: number,
  lat: number,
): { azimuth: number; altitude: number } {
  // Trigonometrical functions
  const sh = math.sin(math.bignumber(ha).times(DEG_TO_RAD))
  const ch = math.cos(math.bignumber(ha).times(DEG_TO_RAD))
  const sd = math.sin(math.bignumber(dec2000).times(DEG_TO_RAD))
  const cd = math.cos(math.bignumber(dec2000).times(DEG_TO_RAD))
  const sp = math.sin(math.bignumber(lat).times(DEG_TO_RAD))
  const cp = math.cos(math.bignumber(lat).times(DEG_TO_RAD))

  // azimuth and altitude unit vector
  const x = sd.times(cp).minus(ch.times(cd).times(sp))
  const y = sh.times(cd).neg()
  const z = sd.times(sp).plus(ch.times(cd).times(cp))

  // to spherical coordinates
  const r = math.sqrt(x.pow(2).plus(y.pow(2)))
  const a = r.isZero()
    ? math.bignumber(0)
    : (math.atan2(y as unknown as number, x as unknown as number) as unknown as BigNumber)

  const azimuth = normalizeAngle(a) // Normalize to [0, 2π)
  const altitude = math.atan2(
    z as unknown as number,
    r as unknown as number,
  ) as unknown as BigNumber

  return {
    azimuth: math.number(azimuth.mul(RAD_TO_DEG)),
    altitude: math.number(altitude.mul(RAD_TO_DEG)),
  }
}

/**
 * Calculate the airmass of a celestial object based on its altitude.
 * @param altitude altitude in degrees.
 * @returns Airmass value.
 * @see {@link /docs/reference/astronomical/#getairmass}
 */
export function getAirmass(altitude: number) {
  return math.number(math.csc(math.bignumber(altitude).mul(DEG_TO_RAD)))
}
