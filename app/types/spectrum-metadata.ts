import { z } from "zod"
import { fitsString, sexasegimal } from "./utils"

/**
 * Describes a value that the user declared as "missing" or "lost".
 * Different from `null` or an empty string, which indicates that the user
 * didn't provide a value yet.
 */
const knowable = <T extends z.ZodType>(field: T) =>
  z.object({
    value: field,
    isKnown: z.boolean(),
  })

/**
 * Part of the spectrum metadata is shared among all the spectra in a plate.
 * This schema defines the metadata for a single plate.
 */
export const PlateMetadataSchema = z.object({
  OBSERVAT: fitsString().min(1),
  "PLATE-N": fitsString().min(1),
  OBSERVER: knowable(fitsString()),
  DIGITALI: knowable(fitsString()),
  SCANNER: knowable(fitsString()),
  SOFTWARE: knowable(fitsString()),
  TELESCOPE: knowable(fitsString()),
  DETECTOR: knowable(fitsString()),
  INSTRUMENT: knowable(fitsString()),
})
/**
 * Compute the completion percentage of the plate metadata.
 * It counts how many fields are filled in, considering `isKnown` and `value`.
 */
export function getPlateMetadataCompletion(metadata: z.infer<typeof PlateMetadataSchema>): {
  completed: number
  total: number
  percentage: number
} {
  const total = Object.keys(PlateMetadataSchema.shape).length
  const completed = Object.values(metadata).filter((value) => {
    if (typeof value === "object") {
      return !value.isKnown || value.value.length > 0
    }
    return value.length > 0
  }).length
  return {
    completed,
    total,
    percentage: (completed / total) * 100,
  }
}

/**
 * This schema defines the metadata for a single observation with multiple spectra.
 */
export const ObservationMetadataSchema = z.object({
  OBJECT: fitsString(),
  "DATE-OBS": knowable(z.iso.date().or(z.literal(""))), // yyyy-MM-dd
  UT: knowable(z.iso.time().or(z.literal(""))), // HH:mm:ss.sss (any precision)

  "MAIN-ID": knowable(fitsString()),
  SPTYPE: knowable(fitsString()),
  RA: knowable(z.iso.time().or(z.literal(""))), // HH:mm:ss.sss (any precision)
  DEC: knowable(sexasegimal().or(z.literal(""))), // ±ddd:mm:ss.sss (any precision)
  EQUINOX: knowable(fitsString()),
  RA2000: knowable(z.iso.time().or(z.literal(""))), // HH:mm:ss.sss (any precision)
  DEC2000: knowable(sexasegimal().or(z.literal(""))), // ±ddd:mm:ss.sss (any precision)
  RA1950: knowable(z.iso.time().or(z.literal(""))), // HH:mm:ss.sss (any precision)
  DEC1950: knowable(sexasegimal().or(z.literal(""))), // ±ddd:mm:ss.sss (any precision)
  "TIME-OBS": knowable(z.iso.time().or(z.literal(""))),
  JD: knowable(z.string().regex(z.regexes.number).or(z.literal(""))),
  ST: knowable(z.iso.time().or(z.literal(""))), // HH:mm:ss.sss (any precision)
  HA: knowable(sexasegimal().or(z.literal(""))), // ±ddd:mm:ss.sss (any precision)
  AIRMASS: knowable(z.string().regex(z.regexes.number).or(z.literal(""))),

  GAIN: knowable(fitsString()),
  EXPTIME: knowable(fitsString()),
  DETECTOR: knowable(fitsString()),
  IMAGETYP: knowable(fitsString()),
})
/**
 * Compute the completion percentage of the observation metadata.
 * It counts how many fields are filled in, considering `isKnown` and `value`.
 */
export function getObservationMetadataCompletion(
  metadata: z.infer<typeof ObservationMetadataSchema>,
): { completed: number; total: number; percentage: number } {
  const total = Object.keys(ObservationMetadataSchema.shape).length
  const completed = Object.values(metadata).filter((value) => {
    if (typeof value === "object") {
      return !value.isKnown || value.value.length > 0
    }
    return value.length > 0
  }).length
  return {
    completed,
    total,
    percentage: (completed / total) * 100,
  }
}
