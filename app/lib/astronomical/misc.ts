import { type BigNumber, DEG_TO_RAD, math, normalizeAngle, RAD_TO_DEG } from "~/lib/math"

/**
 * Calculate the local hour angle of a celestial object.
 * @param ra right ascension in degrees, referred to the same equinox as `st`.
 * @param st local mean sidereal time in degrees.
 * @returns Hour angle in degrees.
 * @see {@link /docs/reference/astronomical/#gethourangle}
 */
export function getHourAngle(ra: number, st: number): number {
  return normalizeAngle(st - ra, "degrees")
}

/**
 * Equatorial to horizontal coordinates: transform hour angle and declination
 * to azimuth and altitude.
 *
 * NOTE: removal candidate. Nothing in the application calls this anymore — the
 * airmass now uses {@link getCosZenithDistance}, and no other stage needs the
 * azimuth. Kept because it is documented reference API; see #327 before
 * deleting it.
 * @param ha local hour angle in degrees.
 * @param dec declination in degrees, referred to the same equinox as `ha`.
 * @param lat latitude of the observer in degrees.
 * @return azimuth and altitude in degrees.
 * @see {@link /docs/reference/astronomical/#equatorialtohorizontal}
 */
export function equatorialToHorizontal(
  ha: number,
  dec: number,
  lat: number,
): { azimuth: number; altitude: number } {
  // Trigonometrical functions
  const sh = math.sin(math.bignumber(ha).times(DEG_TO_RAD))
  const ch = math.cos(math.bignumber(ha).times(DEG_TO_RAD))
  const sd = math.sin(math.bignumber(dec).times(DEG_TO_RAD))
  const cd = math.cos(math.bignumber(dec).times(DEG_TO_RAD))
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
 * Cosine of the zenith distance of a celestial object.
 *
 * This is the vertical component of the horizontal unit vector, so it equals
 * the sine of the altitude angle. Computing it directly avoids going through
 * {@link equatorialToHorizontal}, which also resolves an azimuth that the
 * airmass does not need.
 * @param ha local hour angle in degrees.
 * @param dec declination in degrees, referred to the same equinox as `ha`.
 * @param lat latitude of the observer in degrees.
 * @returns Cosine of the zenith distance, in [-1, 1].
 * @see {@link /docs/reference/astronomical/#getcoszenithdistance}
 */
export function getCosZenithDistance(ha: number, dec: number, lat: number): number {
  const ch = math.cos(math.bignumber(ha).times(DEG_TO_RAD))
  const sd = math.sin(math.bignumber(dec).times(DEG_TO_RAD))
  const cd = math.cos(math.bignumber(dec).times(DEG_TO_RAD))
  const sp = math.sin(math.bignumber(lat).times(DEG_TO_RAD))
  const cp = math.cos(math.bignumber(lat).times(DEG_TO_RAD))

  return math.number(sd.times(sp).plus(ch.times(cd).times(cp)))
}

/**
 * Calculate the airmass of a celestial object based on its altitude.
 *
 * NOTE: removal candidate. Nothing in the application calls this anymore —
 * `AIRMASS` is computed with {@link getAirmassFromCosZenithDistance}, which is
 * numerically identical (verified to 8.9e-16 across 30 cases) but skips the
 * `atan2` round trip through the altitude angle. Kept because it is documented
 * reference API; see #327 before deleting it.
 * @param altitude altitude in degrees.
 * @returns Airmass value.
 * @see {@link /docs/reference/astronomical/#getairmass}
 */
export function getAirmass(altitude: number) {
  return math.number(math.csc(math.bignumber(altitude).mul(DEG_TO_RAD)))
}

/**
 * Calculate the airmass of a celestial object from the cosine of its zenith
 * distance, assuming a plane-parallel atmosphere.
 * @param cosZenithDistance cosine of the zenith distance, as returned by
 * {@link getCosZenithDistance}.
 * @returns Airmass value.
 * @see {@link /docs/reference/astronomical/#getairmassfromcoszenithdistance}
 */
export function getAirmassFromCosZenithDistance(cosZenithDistance: number) {
  return math.number(math.bignumber(1).div(cosZenithDistance))
}
