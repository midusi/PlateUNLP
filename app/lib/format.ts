/**
 * Converts a decimal degree value to a string representation in degrees, minutes, and seconds (DMS).
 * @param deg - The decimal degree value to convert.
 * @param opts.digits - The number of decimal places to include in the seconds part of the DMS string (default: 4).
 * @param opts.sep - The separator to use between the degrees, minutes, and seconds (default: ":").
 */
export function degToDMS(deg: number, opts: { digits?: number; sep?: string } = {}) {
  const digits = opts.digits ?? 4
  const sep = opts.sep ?? ":"

  if (!Number.isFinite(deg)) throw new RangeError("degToDMS: `deg` must be a number")
  if (!Number.isSafeInteger(digits) || digits < 0)
    throw new RangeError("degToDMS: `digits` must be a positive number")

  const sign = deg < 0 ? "-" : ""
  deg = Math.abs(deg)
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  const s = ((deg - d) * 60 - m) * 60
  return [
    sign,
    d.toString().padStart(2, "0"),
    sep,
    m.toString().padStart(2, "0"),
    sep,
    digits === 0
      ? Math.round(s).toString().padStart(2, "0")
      : s.toFixed(digits).padStart(3 + digits, "0"),
  ].join("")
}

/**
 * Converts a decimal degree value to a string representation in hours, minutes, and seconds (HMS).
 * It maxes at 24 hours.
 * @param deg - The decimal degree value to convert.
 * @param opts.digits - The number of decimal places to include in the seconds part of the HMS string (default: 4).
 * @param opts.sep - The separator to use between the hours, minutes, and seconds (default: ":").
 */
export function degToHMS(deg: number, opts: { digits?: number; sep?: string } = {}) {
  const digits = opts.digits ?? 4
  const sep = opts.sep ?? ":"

  if (!Number.isFinite(deg)) throw new RangeError("degToHMS: `deg` must be a number")
  if (!Number.isSafeInteger(digits) || digits < 0)
    throw new RangeError("degToHMS: `digits` must be a positive number")

  const sign = deg < 0 ? "-" : ""
  deg = Math.abs(deg * (24 / 360)) // Convert to hours
  const d = Math.floor(deg)
  const m = Math.floor((deg - d) * 60)
  const s = ((deg - d) * 60 - m) * 60
  return [
    sign,
    d.toString().padStart(2, "0"),
    sep,
    m.toString().padStart(2, "0"),
    sep,
    digits === 0
      ? Math.round(s).toString().padStart(2, "0")
      : s.toFixed(digits).padStart(3 + digits, "0"),
  ].join("")
}

/**
 * Converts a radians to a string representation in hours, minutes, and seconds (HMS).
 * It maxes at 24 hours, the value must be between 0 and 2π radians.
 * @param rad - The radian value to convert.
 * @param opts.digits - The number of decimal places to include in the seconds part of the HMS string (default: 4).
 * @param opts.sep - The separator to use between the hours, minutes, and seconds (default: ":").
 */
export function radToHMS(rad: number, opts?: { digits?: number; sep?: string }) {
  return degToHMS(rad * (180 / Math.PI), opts)
}
