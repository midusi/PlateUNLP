import { z } from "zod"

/**
 * As per the FITS standard version 4.0 section "4.2.1.1 Single-record string
 * keywords", this function returns a Zod type that validates a printable ASCII
 * string that can be used as a FITS keyword. That is, characters between
 * space (0x20) and tilde (0x7E), inclusive.
 */
export const fitsString = () =>
  z
    .string()
    .trim()
    .regex(/^[\x20-\x7E]*$/g, {
      error: ({ input }) => {
        const c = input?.match(/[^\x20-\x7E]/g)?.[0]
        return `Invalid character: '${c}'`
      },
    })

/**
 * Validates a sexagesimal string in the format as
 * ±ddd:mm:ss.sss, of any precision as long as it's less than 360 deg.
 */
export const sexasegimal = () =>
  z
    .string()
    .regex(
      /[+-]?(?:[0-2]\d|3[0-5]|\d)?\d:[0-5]\d:[0-5]\d(?:\.\d+)?/g,
      "Invalid sexagesimal format, expected ±ddd:mm:ss.sss",
    )
