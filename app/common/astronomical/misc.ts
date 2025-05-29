import { normalizeAngle } from "@/common/math"

/**
 * Calculate the hour angle of a celestial object, as ST - RA.
 * @param ra1950 Right Ascension in degrees (FK4 system, J1950)
 * @param st Sidereal Time in degrees.
 * @returns Hour angle in degrees.
 */
export function hourAngle(ra1950: number, st: number): number {
  return normalizeAngle(st - ra1950, "degrees")
}
