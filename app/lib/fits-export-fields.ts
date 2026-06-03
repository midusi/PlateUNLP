import type { z } from "zod"
import type { FITSExportField } from "~/components/FITSExportButton"
import type {
  ObservationMetadataSchema,
  PlateMetadataSchema,
} from "~/types/spectrum-metadata"

/**
 * FITS keywords that the export button should NOT flag when they're left blank.
 * Notes fields are free-form and routinely absent, so we don't pester the user
 * about them — they'll just produce an empty card in the exported FITS.
 */
export const OPTIONAL_FITS_FIELDS: readonly string[] = [
  "OBSNOTES",
  "PLATNOTE",
  "SCANNOTE",
  "OBJNOTES",
  "CALNOTES",
]

type PlateMetadata = z.infer<typeof PlateMetadataSchema>
type ObservationMetadata = z.infer<typeof ObservationMetadataSchema>

/**
 * Flattens the plate metadata into the shape the FITSExportButton consumes.
 * Required fields (`PLATE-N`, `OBSERVAT`) are emitted with `isKnown=true` so
 * the warning still fires if they were left blank.
 */
export function plateMetadataFields(plate: PlateMetadata): FITSExportField[] {
  return [
    { label: "PLATE-N", value: plate["PLATE-N"], isKnown: true },
    { label: "OBSERVAT", value: plate.OBSERVAT, isKnown: true },
    { label: "TELESCOPE", value: plate.TELESCOPE.value, isKnown: plate.TELESCOPE.isKnown },
    { label: "INSTRUME", value: plate.INSTRUME.value, isKnown: plate.INSTRUME.isKnown },
    { label: "DETECTOR", value: plate.DETECTOR.value, isKnown: plate.DETECTOR.isKnown },
    { label: "OBSERVER", value: plate.OBSERVER.value, isKnown: plate.OBSERVER.isKnown },
    { label: "OBSNOTES", value: plate.OBSNOTES.value, isKnown: plate.OBSNOTES.isKnown },
    { label: "PLATNOTE", value: plate.PLATNOTE.value, isKnown: plate.PLATNOTE.isKnown },
    { label: "SCANNER", value: plate.SCANNER.value, isKnown: plate.SCANNER.isKnown },
    { label: "SCANRES", value: plate.SCANRES.value, isKnown: plate.SCANRES.isKnown },
    { label: "SCANGAIN", value: plate.SCANGAIN.value, isKnown: plate.SCANGAIN.isKnown },
    { label: "SCANSOFT", value: plate.SCANSOFT.value, isKnown: plate.SCANSOFT.isKnown },
    { label: "DATESCAN", value: plate.DATESCAN.value, isKnown: plate.DATESCAN.isKnown },
    { label: "SCANAUTH", value: plate.SCANAUTH.value, isKnown: plate.SCANAUTH.isKnown },
    { label: "SCANNOTE", value: plate.SCANNOTE.value, isKnown: plate.SCANNOTE.isKnown },
  ]
}

/** Flattens the observation metadata into FITSExportField entries. */
export function observationMetadataFields(obs: ObservationMetadata): FITSExportField[] {
  return [
    { label: "OBJECT", value: obs.OBJECT, isKnown: true },
    { label: "DATE-OBS", value: obs["DATE-OBS"].value, isKnown: obs["DATE-OBS"].isKnown },
    { label: "EXPTIME", value: obs.EXPTIME.value, isKnown: obs.EXPTIME.isKnown },
    { label: "IMAGETYP", value: obs.IMAGETYP.value, isKnown: obs.IMAGETYP.isKnown },
    { label: "OBJNOTES", value: obs.OBJNOTES.value, isKnown: obs.OBJNOTES.isKnown },
    { label: "MAIN-ID", value: obs["MAIN-ID"].value, isKnown: obs["MAIN-ID"].isKnown },
    { label: "SPTYPE", value: obs.SPTYPE.value, isKnown: obs.SPTYPE.isKnown },
    { label: "DATE-ORG", value: obs["DATE-ORG"].value, isKnown: obs["DATE-ORG"].isKnown },
    { label: "JD", value: obs.JD.value, isKnown: obs.JD.isKnown },
    { label: "ST", value: obs.ST.value, isKnown: obs.ST.isKnown },
    { label: "HA", value: obs.HA.value, isKnown: obs.HA.isKnown },
    { label: "RA", value: obs.RA.value, isKnown: obs.RA.isKnown },
    { label: "DEC", value: obs.DEC.value, isKnown: obs.DEC.isKnown },
    { label: "EQUINOX", value: obs.EQUINOX.value, isKnown: obs.EQUINOX.isKnown },
    { label: "RA2000", value: obs.RA2000.value, isKnown: obs.RA2000.isKnown },
    { label: "DEC2000", value: obs.DEC2000.value, isKnown: obs.DEC2000.isKnown },
    { label: "RA1950", value: obs.RA1950.value, isKnown: obs.RA1950.isKnown },
    { label: "DEC1950", value: obs.DEC1950.value, isKnown: obs.DEC1950.isKnown },
    { label: "AIRMASS", value: obs.AIRMASS.value, isKnown: obs.AIRMASS.isKnown },
  ]
}

type CalibrationFields = {
  material: string
  inferenceFunction: string
  CALNOTES: string
  "CALNOTES?": boolean
}

/** Flattens the calibration metadata into FITSExportField entries. */
export function calibrationMetadataFields(cal: CalibrationFields): FITSExportField[] {
  return [
    { label: "CALMATER", value: cal.material, isKnown: true },
    { label: "CALFUNC", value: cal.inferenceFunction, isKnown: true },
    { label: "CALNOTES", value: cal.CALNOTES, isKnown: cal["CALNOTES?"] },
  ]
}
