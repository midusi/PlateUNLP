import { z } from "zod/v4"
import { fitsString, sexasegimal } from "./utils"

/**
 * Describes a value that the user declared as "missing" or "lost".
 * Different from `null` or an empty string, which indicates that the user
 * didn't provide a value yet.
 */
const MISSING = z.literal("MISSING")

/**
 * Part of the spectrum metadata is shared among all the spectra in a plate.
 * This schema defines the metadata for a single plate.
 */
export const PlateMetadataSchema = z.object({
  OBSERVAT: fitsString().min(1),
  "PLATE-N": fitsString().min(1),
  OBSERVER: fitsString(),
  DIGITALI: fitsString(),
  SCANNER: fitsString(),
  SOFTWARE: fitsString(),
  TELESCOPE: fitsString(),
  DETECTOR: fitsString(),
  INSTRUMENT: fitsString(),
})

/**
 * This schema defines the metadata for a single observation with multiple spectra.
 */
export const ObservationMetadataSchema = z.object({
  OBJECT: fitsString().min(1),
  "DATE-OBS": z.iso.date(), // yyyy-MM-dd
  UT: z.iso.time(), // HH:mm:ss.sss (any precision)

  "MAIN-ID": fitsString(),
  SPTYPE: fitsString(),
  RA: z.iso.time().or(MISSING), // HH:mm:ss.sss (any precision)
  DEC: sexasegimal().or(MISSING), // ±ddd:mm:ss.sss (any precision)
  EQUINOX: fitsString(),
  RA2000: z.iso.time().or(MISSING), // HH:mm:ss.sss (any precision)
  DEC2000: sexasegimal().or(MISSING), // ±ddd:mm:ss.sss (any precision)
  RA1950: z.iso.time().or(MISSING), // HH:mm:ss.sss (any precision)
  DEC1950: sexasegimal().or(MISSING), // ±ddd:mm:ss.sss (any precision)
  "TIME-OBS": z.iso.time().or(MISSING),
  JD: z.number().positive().or(MISSING).nullable(),
  ST: z.iso.time().or(MISSING), // HH:mm:ss.sss (any precision)
  HA: sexasegimal().or(MISSING), // ±ddd:mm:ss.sss (any precision)
  AIRMASS: z.number().positive().or(MISSING).nullable(),

  GAIN: fitsString(),
  EXPTIME: fitsString(),
  DETECTOR: fitsString(),
  IMAGETYP: fitsString(),
})
