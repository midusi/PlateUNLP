import { z } from "zod"
import { fitsString, localDateTime, numericText, sexasegimal } from "./utils"

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
  TELESCOPE: knowable(fitsString()),
  INSTRUME: knowable(fitsString()),
  DETECTOR: knowable(fitsString()),
  OBSERVER: knowable(fitsString()),
  OBSNOTES: knowable(fitsString()),
  PLATNOTE: knowable(fitsString()),
  SCANNER: knowable(fitsString()),
  SCANRES: knowable(numericText()),
  SCANGAIN: knowable(numericText()),
  SCANSOFT: knowable(fitsString()),
  DATESCAN: knowable(localDateTime().or(z.literal(""))),
  SCANAUTH: knowable(fitsString()),
  SCANNOTE: knowable(fitsString()),
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
  "DATE-OBS": knowable(localDateTime().or(z.literal(""))), // yyyy-MM-ddTHH:mm[:ss[.sss]]
  EXPTIME: knowable(numericText()),
  IMAGETYP: knowable(fitsString()),

  "MAIN-ID": knowable(fitsString()),
  SPTYPE: knowable(fitsString()),
  RA: knowable(z.iso.time().or(z.literal(""))), // HH:mm:ss.sss (any precision)
  DEC: knowable(sexasegimal().or(z.literal(""))), // ±ddd:mm:ss.sss (any precision)
  EQUINOX: knowable(fitsString()),
  RA2000: knowable(z.iso.time().or(z.literal(""))), // HH:mm:ss.sss (any precision)
  DEC2000: knowable(sexasegimal().or(z.literal(""))), // ±ddd:mm:ss.sss (any precision)
  RA1950: knowable(z.iso.time().or(z.literal(""))), // HH:mm:ss.sss (any precision)
  DEC1950: knowable(sexasegimal().or(z.literal(""))), // ±ddd:mm:ss.sss (any precision)
  "DATE-ORG": knowable(localDateTime().or(z.literal(""))),
  JD: knowable(z.string().regex(z.regexes.number).or(z.literal(""))),
  ST: knowable(z.iso.time().or(z.literal(""))), // HH:mm:ss.sss (any precision)
  HA: knowable(sexasegimal().or(z.literal(""))), // ±ddd:mm:ss.sss (any precision)
  AIRMASS: knowable(z.string().regex(z.regexes.number).or(z.literal(""))),
  OBJNOTES: knowable(fitsString()),
})
/**
 * Observation metadata fields derived from OBJECT + DATE-OBS (the "Compute the
 * rest of the metadata" step). They only make sense for an actual sky object,
 * so they are hidden in the form and omitted from the FITS export when
 * IMAGETYP is anything other than `object`.
 */
export const COMPUTED_OBSERVATION_FIELDS = [
  "MAIN-ID",
  "SPTYPE",
  "DATE-ORG",
  "JD",
  "ST",
  "HA",
  "RA",
  "DEC",
  "EQUINOX",
  "RA2000",
  "DEC2000",
  "RA1950",
  "DEC1950",
  "AIRMASS",
] as const satisfies readonly (keyof z.infer<typeof ObservationMetadataSchema>)[]

const COMPUTED_FIELD_SET = new Set<string>(COMPUTED_OBSERVATION_FIELDS)

/**
 * Whether the computed metadata applies — i.e. the observation is a known sky
 * object. Calibration frames (dark, zero, flat, arc) and unknown types omit it.
 */
export function exportsComputedMetadata(imageType: { value: string; isKnown: boolean }): boolean {
  return imageType.isKnown && imageType.value === "object"
}

/**
 * Compute the completion percentage of the observation metadata.
 * It counts how many fields are filled in, considering `isKnown` and `value`.
 * Computed fields are excluded from the tally when they don't apply.
 */
export function getObservationMetadataCompletion(
  metadata: z.infer<typeof ObservationMetadataSchema>,
): { completed: number; total: number; percentage: number } {
  const showComputed = exportsComputedMetadata(metadata.IMAGETYP)
  const entries = Object.entries(metadata).filter(
    ([key]) => showComputed || !COMPUTED_FIELD_SET.has(key),
  )
  const total = entries.length
  const completed = entries.filter(([, value]) => {
    if (value && typeof value === "object") {
      return !value.isKnown || value.value.length > 0
    }
    return typeof value === "string" && value.length > 0
  }).length
  return {
    completed,
    total,
    percentage: total === 0 ? 100 : (completed / total) * 100,
  }
}

/**
 * This schema defines the metadata for a extraction configuration of spectrums of a observation.
 */
export const ExtractionConfigurationSchema = z.object({
  countMediasPoints: z.number().int().min(1, "Must be at least 1."),
  apertureCoefficient: z.number().min(0.001, "Must be positive"),
  spectrums: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["lamp", "science"]),
      imageWidth: z.number(),
      imageHeight: z.number(),
      imageLeft: z.number(),
      imageTop: z.number(),
    }),
  ),
})
