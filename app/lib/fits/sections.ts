import type { FITS } from "fits2js"
import {
  appendSectionBanner,
  derivePixelSizeFromScanResolution,
  inferRadesys,
  normalizeOptionalDateTime,
  setExposureTimeCard,
  setNumericCard,
  setTextCard,
  toASCIIHeaderString,
  toFITSDateTimeString,
  toLocalObservationDateTime,
} from "./utils"

export type PlateMetadata = {
  plateNumber?: string
  observatory?: string
  observer?: string
  telescope?: string
  instrument?: string
  detector?: string
  observerNotes?: string
  plateNotes?: string
}

export type PlateScanMetadata = PlateMetadata & {
  scanner?: string
  scanResolution?: string
  scanGain?: string
  scanSoftware?: string
  dateScan?: string
  scanAuthor?: string
  scannerNotes?: string
  origin?: string
}

export type PlateFITSMetadata = PlateScanMetadata & {
  fileName: string
}

export type SpectrumCropFITSMetadata = PlateScanMetadata & {
  obsN?: string
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
  objectNotes?: string
  fileName: string
}

export type ExtractedSpectrumFITSMetadata = SpectrumCropFITSMetadata

export type CalibrationMetadata = {
  calibrationMaterial?: string
  calibrationFunction?: string
  calibrationNotes?: string
}

export type CalibratedSpectrumFITSMetadata = SpectrumCropFITSMetadata &
  CalibrationMetadata & {
    wavelengthStart: number
    wavelengthStep: number
    wavelengthUnit?: string
    intensityUnit?: string
  }

export function addPlateMetadata(fits: FITS, metadata: PlateMetadata) {
  appendSectionBanner(fits, "Plate metadata")
  setTextCard(fits, "PLATE-N", metadata.plateNumber, "plate identifier")
  setTextCard(fits, "OBSERVAT", metadata.observatory, "observatory name")
  setTextCard(fits, "TELESCOP", metadata.telescope, "telescope")
  setTextCard(fits, "INSTRUME", metadata.instrument, "instrument")
  setTextCard(fits, "DETECTOR", metadata.detector, "detector")
  setTextCard(fits, "OBSERVER", metadata.observer, "observer name")
  setTextCard(fits, "OBSNOTES", metadata.observerNotes, "observer notes")
  setTextCard(fits, "PLATNOTE", metadata.plateNotes, "plate notes")
}

export function addScannedPlateMetadata(fits: FITS, metadata: PlateScanMetadata) {
  appendSectionBanner(fits, "Scanned plate")
  setTextCard(fits, "SCANNER", metadata.scanner, "scanner name")
  setNumericCard(fits, "SCANRES", metadata.scanResolution, "[dpi] scan resolution")
  setNumericCard(
    fits,
    "PIXSIZE",
    derivePixelSizeFromScanResolution(metadata.scanResolution),
    "[um] pixel size",
  )
  setNumericCard(fits, "SCANGAIN", metadata.scanGain, "gain, electrons per adu")
  setTextCard(fits, "SCANSOFT", metadata.scanSoftware, "name of the scanning software")
  setTextCard(fits, "DATESCAN", normalizeOptionalDateTime(metadata.dateScan), "scan date and time")
  setTextCard(fits, "SCANAUTH", metadata.scanAuthor, "author of scan")
  setTextCard(fits, "SCANNOTE", metadata.scannerNotes, "scanner notes")
}

export function addObservationMetadata(fits: FITS, metadata: SpectrumCropFITSMetadata) {
  appendSectionBanner(fits, "Original data of the observation")
  setTextCard(fits, "OBS-N", metadata.obsN, "observation label within the plate")
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
  setExposureTimeCard(fits, metadata.exptime)
  setTextCard(fits, "OBJNOTES", metadata.objectNotes, "observation notes")

  appendSectionBanner(fits, "Computed data of the observation")
  setTextCard(fits, "MAIN-ID", metadata.mainId, "Simbad main ID object name")
  setTextCard(fits, "SPTYPE", metadata.spectralType, "Simbad spectral type")
  setTextCard(fits, "ST", metadata.siderealTime, "local mean sidereal time")
  setTextCard(fits, "HA", metadata.hourAngle, "local mean hour angle")
  setNumericCard(fits, "JD", metadata.jd, "Julian mean date of the observation")
  setNumericCard(fits, "EPOCH", metadata.epoch ?? metadata.equinox, "epoch of RA and DEC")
  setNumericCard(fits, "EQUINOX", metadata.equinox, "epoch of RA and DEC")
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
  setNumericCard(fits, "AIRMASS", metadata.airmass, "estimated airmass at observation time")
}

export function addCalibrationMetadata(fits: FITS, metadata: CalibrationMetadata) {
  appendSectionBanner(fits, "Calibration metadata")
  setTextCard(fits, "CALMATER", metadata.calibrationMaterial, "calibration material")
  setTextCard(fits, "CALFUNC", metadata.calibrationFunction, "calibration function")
  setTextCard(fits, "CALNOTES", metadata.calibrationNotes, "calibration notes")
}

export function addWavelengthAxisWCS(
  fits: FITS,
  {
    wavelengthStart,
    wavelengthStep,
    wavelengthUnit,
    intensityUnit,
  }: {
    wavelengthStart: number
    wavelengthStep: number
    wavelengthUnit?: string
    intensityUnit?: string
  },
) {
  appendSectionBanner(fits, "World Coordinate System (WCS)")
  fits.header.set("BUNIT", intensityUnit ?? "relative intensity", {
    comment: "intensity units",
  })
  fits.header.addAxis(1, {
    ctype: "WAVE",
    cunit: wavelengthUnit ?? "Angstrom",
    crpix: 1,
    crval: wavelengthStart,
    cdelt: wavelengthStep,
  })
  fits.header.set("CNAME1", "Wavelength", { comment: "axis name" })
}

export function addDataFileMetadata(fits: FITS, fileName: string, origin?: string) {
  appendSectionBanner(fits, "Data files")
  fits.header.set("FILENAME", fileName, { comment: "filename of this file" })
  fits.header.set("ORIGIN", toASCIIHeaderString(origin), { comment: "origin of this file" })
  fits.header.set("DATE", toFITSDateTimeString(new Date()), {
    comment: "last change of this file",
  })
}

export function addExtractedSpectrumWCS(fits: FITS) {
  appendSectionBanner(fits, "World Coordinate System (WCS)")
  fits.header.set("WCSAXES", 1, { comment: "number of axes in the WCS description" })
  fits.header.set("BUNIT", "adu", { comment: "physical units of the array values" })
  fits.header.set("CTYPE1", "LINEAR", { comment: "linear coordinate type" })
  fits.header.set("CNAME1", "Scanned pixel", { comment: "axis name" })
  fits.header.set("CUNIT1", "pixel", { comment: "axis units" })
  fits.header.set("CRPIX1", 1.0, { comment: "reference pixel" })
  fits.header.set("CRVAL1", 1.0, { comment: "coordinate at reference pixel" })
  fits.header.set("CDELT1", 1.0, { comment: "coordinate increment per pixel" })
}

export function addExtractedObservationWCS(fits: FITS) {
  appendSectionBanner(fits, "World Coordinate System (WCS)")
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

export function addHistoryMetadata(fits: FITS) {
  appendSectionBanner(fits, "Modification history")
  fits.header.appendHistory(`Header written with PlateUNLP at ${toFITSDateTimeString(new Date())}`)
}
