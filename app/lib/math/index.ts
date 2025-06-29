import { all as allMath, type BigNumber, create as createMath, type Matrix } from "mathjs"

export const math = createMath(allMath, {
  relTol: 1e-12,
  absTol: 1e-15,
  matrix: "Matrix",
  number: "BigNumber",
  precision: 32,
})

export const ARCSEC_TO_RAD = math.bignumber("4.848136811095359935899141e-6") // Arcseconds to radians
export const DEG_TO_RAD = math.bignumber("1.745329251994329576923691e-2") // Degrees to radians
export const RAD_TO_DEG = math.bignumber("57.29577951308232087679815") // Radians to degrees

/**
 * Performs integer division, rounding towards zero.
 * @param a The dividend.
 * @param b The divisor.
 * @returns The quotient of a and b, rounded towards zero.
 */
export function div<T extends number | BigNumber>(a: T, b: T) {
  return math.floor(math.divide(a, b) as T)
}

/**
 * Normalizes an angle to the range [0, 2π) or [0, 360) depending on the system.
 * @param angle The angle in radians.
 * @param system The system to normalize to, either "radians" or "degrees". Defaults to "radians".
 * @returns The normalized angle in the specified system.
 */
export function normalizeAngle<T extends number | BigNumber>(
  angle: T,
  system: "radians" | "degrees" = "radians",
) {
  // math.tau is 2π
  const turn = system === "radians" ? math.tau : 360
  // math.mod always returns a positive value,
  // since it configures Decimal.js with EUCLID mode
  // https://mikemcl.github.io/decimal.js/#modulo
  return math.mod<T>(angle, turn)
}

/**
 * Creates a rotation matrix for 3D rotations around the specified axis.
 * @param angle The angle of rotation in radians.
 * @param axis The axis of rotation, either "x", "y", or "z".
 * @returns A 3D rotation matrix as a math.js Matrix.
 */
export function rotationMatrix3D<T extends number | BigNumber>(
  angle: T,
  axis: "x" | "y" | "z",
): Matrix<T> {
  // sin and cos have broken type definitions in math.js
  const s = math.sin(angle as number) as T
  const c = math.cos(angle as number) as T

  const i = "xyz".indexOf(axis),
    a1 = (i + 1) % 3,
    a2 = (i + 2) % 3
  const R: (number | BigNumber)[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  R[i][i] = 1
  R[a1][a1] = c
  R[a1][a2] = s
  R[a2][a1] = -s
  R[a2][a2] = c

  // This extra step is necessary because inconsistent types break the type system.
  if (typeof angle === "number") {
    return math.matrix(R.map((row) => row.map((n) => math.number(n)))) as Matrix<T>
  } else {
    return math.matrix(R.map((row) => row.map((n) => math.bignumber(n)))) as Matrix<T>
  }
}

/**
 * Clamps a number between a minimum and maximum value.
 * @param num The number to clamp.
 * @param min The minimum value.
 * @param max The maximum value.
 * @returns The clamped value.
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(num, max))
}

export type { BigNumber, Matrix }
