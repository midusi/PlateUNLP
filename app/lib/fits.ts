import { TZDate } from "@date-fns/tz"
import { UTCDate } from "@date-fns/utc"
import { formatDate } from "date-fns"
import { FITS } from "fits2js"
import { normalizeLocalDateTime } from "./local-datetime"

type CommonMetadata = {
  plateNumber?: string
  observatory?: string
  observer?: string
  telescope?: string
  instrument?: string
}

type PlateScanMetadata = CommonMetadata & {
  observerNotes?: string
  notes?: string
  scanner?: string
  scanResolution?: string
  scanGain?: string
  scanSoftware?: string
  dateScan?: string
  scanAuthor?: string
  origin?: string
}

export type PlateFITSMetadata = PlateScanMetadata & {
  fileName: string
}

export type SpectrumCropFITSMetadata = PlateScanMetadata & {
  object?: string
  dateObs?: string
  dateOrg?: string
  observatoryTimezone?: string
  exptime?: string
  imageType?: string
  mainId?: string
  spectralType?: string
  epoch?: string
  radesys?: string
  ra?: string
  dec?: string
  equinox?: string
  ra2000?: string
  dec2000?: string
  ra1950?: string
  dec1950?: string
  jd?: string
  siderealTime?: string
  hourAngle?: string
  airmass?: string
  fileName: string
}

export type ExtractedSpectrumFITSMetadata = SpectrumCropFITSMetadata

export type CalibratedSpectrumFITSMetadata = CommonMetadata & {
  object?: string
  dateObs?: string
  exptime?: string
  imageType?: string
  mainId?: string
  spectralType?: string
  calibrationMaterial?: string
  calibrationFunction?: string
  wavelengthStart: number
  wavelengthStep: number
  wavelengthUnit?: string
  intensityUnit?: string
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

  fits.header.appendBlank(
    "--------------------------------------- Original data of the observation",
  )
  setTextCard(fits, "OBSERVAT", metadata.observatory, "observatory name")
  setTextCard(fits, "TELESCOP", metadata.telescope, "telescope")
  setTextCard(fits, "INSTRUME", metadata.instrument, "instrument")
  setTextCard(fits, "OBSERVER", metadata.observer, "observer name")
  setTextCard(fits, "OBSNOTES", metadata.observerNotes, "observer notes")
  setTextCard(fits, "NOTES", metadata.notes, "miscellaneous notes")
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

  addObservationMetadata(fits, metadata)
  addScannedPlateMetadata(fits, metadata)
  addDataFileMetadata(fits, metadata.fileName, metadata.origin)
  addExtractedSpectrumWCS(fits)
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

  addObservationMetadata(fits, metadata)
  addScannedPlateMetadata(fits, metadata)
  addDataFileMetadata(fits, metadata.fileName, metadata.origin)
  addExtractedObservationWCS(fits)
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
  addCommonMetadata(fits, metadata)

  fits.header.appendBlank("Observation metadata")
  setIfPresent(fits, "OBJECT", metadata.object, "Observed object")
  setIfPresent(
    fits,
    "DATE-OBS",
    normalizeOptionalDateTime(metadata.dateObs),
    "Observation datetime",
  )
  setIfPresent(fits, "EXPTIME", metadata.exptime, "Exposure time")
  setIfPresent(fits, "IMAGETYP", metadata.imageType, "Observation type")
  setIfPresent(fits, "MAIN-ID", metadata.mainId, "SIMBAD main identifier")
  setIfPresent(fits, "SPTYPE", metadata.spectralType, "Spectral type")

  fits.header.appendBlank("Calibration metadata")
  setIfPresent(fits, "CALMATER", metadata.calibrationMaterial, "Calibration material")
  setIfPresent(fits, "CALFUNC", metadata.calibrationFunction, "Calibration function")
  fits.header.set("BUNIT", metadata.intensityUnit ?? "relative intensity", {
    comment: "Intensity units",
  })
  fits.header.addAxis(1, {
    ctype: "WAVE",
    cunit: metadata.wavelengthUnit ?? "Angstrom",
    crpix: 1,
    crval: metadata.wavelengthStart,
    cdelt: metadata.wavelengthStep,
  })
  fits.header.set("CNAME1", "Wavelength", { comment: "axis name" })

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

function addCommonMetadata(fits: FITS, metadata: CommonMetadata) {
  fits.header.appendBlank("Plate metadata")
  setIfPresent(fits, "PLATE-N", metadata.plateNumber, "Plate identifier")
  setIfPresent(fits, "OBSERVAT", metadata.observatory, "Observatory")
  setIfPresent(fits, "TELESCOP", metadata.telescope, "Telescope")
  setIfPresent(fits, "INSTRUME", metadata.instrument, "Instrument")
  setIfPresent(fits, "OBSERVER", metadata.observer, "Observer")
}

function addScannedPlateMetadata(fits: FITS, metadata: PlateScanMetadata) {
  fits.header.appendBlank(
    "---------------------------------------------------------- Scanned plate",
  )
  setTextCard(
    fits,
    "PLATE-N",
    metadata.plateNumber,
    "plate number in original observation catalogue",
  )
  setTextCard(fits, "SCANNER", metadata.scanner, "scanner name")
  setNumericIfPresent(fits, "SCANRES", metadata.scanResolution, "[dpi] scan resolution")
  setNumericIfPresent(
    fits,
    "PIXSIZE",
    derivePixelSizeFromScanResolution(metadata.scanResolution),
    "[um] pixel size",
  )
  setNumericIfPresent(fits, "SCANGAIN", metadata.scanGain, "gain, electrons per adu")
  setTextCard(fits, "SCANSOFT", metadata.scanSoftware, "name of the scanning software")
  setTextCard(fits, "DATESCAN", normalizeOptionalDateTime(metadata.dateScan), "scan date and time")
  setTextCard(fits, "SCANAUTH", metadata.scanAuthor, "author of scan")
}

function addObservationMetadata(fits: FITS, metadata: SpectrumCropFITSMetadata) {
  fits.header.appendBlank(
    "--------------------------------------- Original data of the observation",
  )
  setTextCard(
    fits,
    "DATE-OBS",
    normalizeOptionalDateTime(metadata.dateObs),
    "UT mean datetime of the observation",
  )
  setTextCard(
    fits,
    "DATE-ORG",
    metadata.dateOrg ?? toLocalObservationDateTime(metadata.dateObs, metadata.observatoryTimezone),
    "Local mean datetime of the observation",
  )
  setTextCard(fits, "OBJECT", metadata.object, "name of the observed object")
  setTextCard(fits, "IMAGETYP", metadata.imageType, "object, dark, zero, etc.")
  setExposureTimeIfPresent(fits, metadata.exptime)
  setTextCard(fits, "OBSERVAT", metadata.observatory, "observatory name")
  setTextCard(fits, "TELESCOP", metadata.telescope, "telescope name")
  setTextCard(fits, "INSTRUME", metadata.instrument, "instrument")
  setTextCard(fits, "OBSERVER", metadata.observer, "observer name")
  setTextCard(fits, "OBSNOTES", metadata.observerNotes, "observer notes")
  setTextCard(fits, "NOTES", metadata.notes, "miscellaneous notes")

  fits.header.appendBlank(
    "--------------------------------------- Computed data of the observation",
  )
  setTextCard(fits, "MAIN-ID", metadata.mainId, "Simbad main ID object name")
  setTextCard(fits, "SPTYPE", metadata.spectralType, "Simbad spectral type")
  setTextCard(fits, "ST", metadata.siderealTime, "local mean sidereal time")
  setTextCard(fits, "HA", metadata.hourAngle, "local mean hour angle")
  setNumericIfPresent(fits, "JD", metadata.jd, "Julian mean date of the observation")
  setNumericIfPresent(fits, "EPOCH", metadata.epoch ?? metadata.equinox, "epoch of RA and DEC")
  setNumericIfPresent(fits, "EQUINOX", metadata.equinox, "epoch of RA and DEC")
  setTextCard(
    fits,
    "RADESYS",
    metadata.radesys ?? inferRadesys(metadata),
    "reference frame of RA and DEC",
  )
  setTextCard(fits, "RA", metadata.ra, 'right ascension FK4 ("h:m:s")')
  setTextCard(fits, "DEC", metadata.dec, 'declination FK4 ("d:m:s")')
  setTextCard(fits, "RA2000", metadata.ra2000, 'right ascension J2000 ("h:m:s")')
  setTextCard(fits, "DEC2000", metadata.dec2000, 'declination J2000 ("d:m:s")')
  setTextCard(fits, "RA1950", metadata.ra1950, 'RA2000 precessed to ep.1950 eq.1950 ("h:m:s")')
  setTextCard(fits, "DEC1950", metadata.dec1950, 'DEC2000 precessed to ep.1950 eq.1950 ("d:m:s")')
  setNumericIfPresent(fits, "AIRMASS", metadata.airmass, "estimated airmass at observation time")
}

function addDataFileMetadata(fits: FITS, fileName: string, origin?: string) {
  fits.header.appendBlank(
    "------------------------------------------------------------- Data files",
  )
  fits.header.set("FILENAME", fileName, { comment: "filename of this file" })
  fits.header.set("ORIGIN", toASCIIHeaderString(origin), { comment: "origin of this file" })
  fits.header.set("DATE", toFITSDateTimeString(new Date()), {
    comment: "last change of this file",
  })
}

function addExtractedSpectrumWCS(fits: FITS) {
  fits.header.appendBlank(
    "------------------------------------------ World Coordinate System (WCS)",
  )
  fits.header.set("WCSAXES", 1, { comment: "number of axes in the WCS description" })
  fits.header.set("BUNIT", "adu", { comment: "physical units of the array values" })
  fits.header.set("CTYPE1", "LINEAR", { comment: "linear coordinate type" })
  fits.header.set("CNAME1", "Scanned pixel", { comment: "axis name" })
  fits.header.set("CUNIT1", "pixel", { comment: "axis units" })
  fits.header.set("CRPIX1", 1.0, { comment: "reference pixel" })
  fits.header.set("CRVAL1", 1.0, { comment: "coordinate at reference pixel" })
  fits.header.set("CDELT1", 1.0, { comment: "coordinate increment per pixel" })
}

function addExtractedObservationWCS(fits: FITS) {
  fits.header.appendBlank(
    "------------------------------------------ World Coordinate System (WCS)",
  )
  fits.header.set("WCSAXES", 2, { comment: "number of axes in the WCS description" })
  fits.header.set("BUNIT", "adu", { comment: "physical units of the array values" })
  fits.header.set("CTYPE1", "LINEAR", { comment: "linear coordinate type" })
  fits.header.set("CNAME1", "Scanned pixel", { comment: "axis name" })
  fits.header.set("CUNIT1", "pixel", { comment: "axis units" })
  fits.header.set("CRPIX1", 1.0, { comment: "reference pixel" })
  fits.header.set("CRVAL1", 1.0, { comment: "coordinate at reference pixel" })
  fits.header.set("CDELT1", 1.0, { comment: "coordinate increment per pixel" })
  fits.header.set("CNAME2", "Spectrum index", { comment: "axis name" })
  fits.header.set("CRPIX2", 1.0, { comment: "reference pixel" })
  fits.header.set("CRVAL2", 1.0, { comment: "coordinate at reference pixel" })
  fits.header.set("CDELT2", 1.0, { comment: "coordinate increment per index" })
}

function addHistoryMetadata(fits: FITS) {
  fits.header.appendBlank(
    "--------------------------------------------------- Modification history",
  )
  fits.header.appendHistory(`Header written with PlateUNLP at ${toFITSDateTimeString(new Date())}`)
}

function setIfPresent(fits: FITS, keyword: string, value: string | undefined, comment: string) {
  if (!value) return
  fits.header.set(keyword, value, { comment })
}

function setTextCard(fits: FITS, keyword: string, value: string | undefined, comment: string) {
  fits.header.set(keyword, value ?? "", { comment })
}

function setNumericIfPresent(
  fits: FITS,
  keyword: string,
  value: string | undefined,
  comment: string,
) {
  if (!value) return
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) return
  fits.header.set(keyword, numeric, { comment })
}

function setExposureTimeIfPresent(fits: FITS, value: string | undefined) {
  if (!value) return
  const seconds = parseExposureTimeSeconds(value)
  if (seconds === undefined) return
  fits.header.set("EXPTIME", seconds, { comment: "[s] exposure time" })
}

function fromUint16Array(points: Uint16Array, axes: number[]): FITS {
  const signedPoints = new Int16Array(points.length)
  for (let i = 0; i < points.length; i++) {
    signedPoints[i] = points[i]! - 32768
  }

  const fits = FITS.fromTypedArray(signedPoints, 16, axes)
  fits.header.set("BSCALE", 1, {
    comment: "physical_value = BZERO + BSCALE * array_value",
  })
  fits.header.set("BZERO", 32768, {
    comment: "physical_value = BZERO + BSCALE * array_value",
  })
  return fits
}

function assertPixelCount(length: number, width: number, height: number) {
  if (length !== width * height) {
    throw new RangeError(`Expected ${width * height} pixels, but got ${length}`)
  }
}

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function normalizeOptionalDateTime(value: string | undefined) {
  return value ? normalizeLocalDateTime(value) : undefined
}

function parseExposureTimeSeconds(value: string): number | undefined {
  const numeric = Number.parseFloat(value)
  if (Number.isFinite(numeric)) return numeric

  const match =
    /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i.exec(
      value,
    )
  if (!match) return undefined

  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match
  return (
    Number.parseFloat(days) * 86400 +
    Number.parseFloat(hours) * 3600 +
    Number.parseFloat(minutes) * 60 +
    Number.parseFloat(seconds)
  )
}

function derivePixelSizeFromScanResolution(value: string | undefined) {
  if (!value) return undefined
  const dpi = Number.parseFloat(value)
  if (!Number.isFinite(dpi) || dpi <= 0) return undefined
  return (25400 / dpi).toString()
}

function toLocalObservationDateTime(value: string | undefined, timezone: string | undefined) {
  if (!value || !timezone) return undefined

  try {
    const utcDate = new UTCDate(`${normalizeLocalDateTime(value)}Z`)
    return formatDate(new TZDate(utcDate, timezone), "yyyy-MM-dd'T'HH:mm:ss")
  } catch {
    return undefined
  }
}

function inferRadesys(metadata: {
  ra?: string
  dec?: string
  equinox?: string
  ra2000?: string
  dec2000?: string
}) {
  if (metadata.ra || metadata.dec || metadata.equinox || metadata.ra2000 || metadata.dec2000) {
    return "FK4"
  }
  return undefined
}

function toFITSDateTimeString(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "")
}

function toASCIIHeaderString(value: string | undefined) {
  if (!value) return ""
  return value
    .normalize("NFD") // Split accented letters into base letter + combining mark, e.g. "á" -> "a" + accent.
    .replace(/[\u0300-\u036f]/g, "") // Remove the combining marks so accented Latin letters become plain ASCII letters.
    .replace(/[^\x20-\x7E]/g, "") // Drop any remaining character outside printable ASCII, which FITS headers require.
}
