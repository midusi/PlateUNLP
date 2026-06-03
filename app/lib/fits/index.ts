import { FITS } from "fits2js"
import {
  addCalibrationMetadata,
  addDataFileMetadata,
  addExtractedObservationWCS,
  addExtractedSpectrumWCS,
  addHistoryMetadata,
  addObservationMetadata,
  addPlateMetadata,
  addScannedPlateMetadata,
  addWavelengthAxisWCS,
  type CalibratedSpectrumFITSMetadata,
  type ExtractedSpectrumFITSMetadata,
  type PlateFITSMetadata,
  type SpectrumCropFITSMetadata,
} from "./sections"
import { assertPixelCount, FITS_UNKNOWN, fromUint16Array, sanitizeFilename } from "./utils"

export { FITS_UNKNOWN }

export type {
  CalibratedSpectrumFITSMetadata,
  CalibrationMetadata,
  ExtractedSpectrumFITSMetadata,
  PlateFITSMetadata,
  PlateMetadata,
  SpectrumCropFITSMetadata,
} from "./sections"

/**
 * Resolves a knowable DB field to the value that should be written to a FITS
 * card: the real value when `isKnown` is true, or the `UNKNOWN` sentinel
 * otherwise. Empty strings are passed through (callers warn the user before
 * exporting).
 */
export function unknownable(value: string, isKnown: boolean): string {
  return isKnown ? value : FITS_UNKNOWN
}

export function plateToFITS(
  pixels: Uint16Array,
  {
    width,
    height,
    metadata,
  }: {
    width: number
    height: number
    metadata: PlateFITSMetadata
  },
): FITS {
  assertPixelCount(pixels.length, width, height)

  const fits = fromUint16Array(pixels, [width, height])

  addPlateMetadata(fits, metadata)
  addScannedPlateMetadata(fits, metadata)
  addDataFileMetadata(fits, metadata.fileName, metadata.origin)
  addHistoryMetadata(fits)

  return fits
}

export function spectrumCropToFITS(
  pixels: Uint16Array,
  {
    width,
    height,
    metadata,
  }: {
    width: number
    height: number
    metadata: SpectrumCropFITSMetadata
  },
): FITS {
  assertPixelCount(pixels.length, width, height)

  const fits = fromUint16Array(pixels, [width, height])

  addPlateMetadata(fits, metadata)
  addObservationMetadata(fits, metadata)
  addScannedPlateMetadata(fits, metadata)
  addDataFileMetadata(fits, metadata.fileName, metadata.origin)
  addHistoryMetadata(fits)

  return fits
}

export function extractedSpectrumToFITS(
  intensity: number[],
  metadata: ExtractedSpectrumFITSMetadata,
): FITS {
  const fits = FITS.fromTypedArray(Float64Array.from(intensity), -64, [intensity.length])

  addPlateMetadata(fits, metadata)
  addObservationMetadata(fits, metadata)
  addExtractedSpectrumWCS(fits)
  addScannedPlateMetadata(fits, metadata)
  addDataFileMetadata(fits, metadata.fileName, metadata.origin)
  addHistoryMetadata(fits)

  return fits
}

export function extractedObservationToFITS(
  intensities: number[][],
  metadata: ExtractedSpectrumFITSMetadata,
): FITS {
  if (intensities.length === 0) {
    throw new RangeError("Expected at least one extracted spectrum")
  }

  const maxLength = Math.max(...intensities.map((intensity) => intensity.length))
  if (maxLength === 0) {
    throw new RangeError("Expected at least one extracted sample")
  }

  const flattened = new Float64Array(maxLength * intensities.length)
  flattened.fill(Number.NaN)

  intensities.forEach((intensity, spectrumIndex) => {
    intensity.forEach((value, sampleIndex) => {
      flattened[spectrumIndex * maxLength + sampleIndex] = value
    })
  })

  const fits = FITS.fromTypedArray(flattened, -64, [maxLength, intensities.length])

  addPlateMetadata(fits, metadata)
  addObservationMetadata(fits, metadata)
  addExtractedObservationWCS(fits)
  addScannedPlateMetadata(fits, metadata)
  addDataFileMetadata(fits, metadata.fileName, metadata.origin)
  addHistoryMetadata(fits)

  fits.header.appendHistory("Axis 2 stores spectra ordered by imageTop then imageLeft")
  if (intensities.some((intensity) => intensity.length !== maxLength)) {
    fits.header.appendHistory("Shorter extracted spectra were padded with NaN values")
  }

  return fits
}

export function calibratedSpectrumToFITS(
  intensity: number[],
  metadata: CalibratedSpectrumFITSMetadata,
): FITS {
  const fits = FITS.fromTypedArray(Float64Array.from(intensity), -64, [intensity.length])

  addPlateMetadata(fits, metadata)
  addObservationMetadata(fits, metadata)
  addCalibrationMetadata(fits, metadata)
  addWavelengthAxisWCS(fits, metadata)
  addScannedPlateMetadata(fits, metadata)
  addDataFileMetadata(fits, metadata.fileName, metadata.origin)
  addHistoryMetadata(fits)

  return fits
}

export function plateToFITSFilename(plateNumber: string): string {
  return `${sanitizeFilename(plateNumber) || "plate"}.fits`
}

export function observationToFITSFilename(
  plateNumber: string | undefined,
  objectName: string | undefined,
  suffix: string,
): string {
  const name = [plateNumber, objectName, suffix].filter(Boolean).join(".")
  return `${sanitizeFilename(name) || suffix}.fits`
}
