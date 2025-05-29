import type { Result } from "neverthrow"
import { err, ok, ResultAsync } from "neverthrow"
import {
  getJulianDate,
  getJulianEpoch,
  getLocalTime,
  getSiderealTime,
} from "@/common/astronomical/datetime"
import { queryObjectById } from "@/common/astronomical/simbad"
import { trpc } from "@/lib/trpc"
import type { GetSpectrumMetadataInput } from "./spectrum-metadata/schema"

export async function getSpectrumMetadata(
  input: GetSpectrumMetadataInput,
): Promise<Result<void, Error>> {
  const { OBSERVAT, OBJECT, "DATE-OBS": DATE_OBS, UT } = input

  // JD, EPOCH, EQUINOX
  const JD = getJulianDate(DATE_OBS, UT)
  const EPOCH = getJulianEpoch(JD)
  const EQUINOX = EPOCH.slice(1) // Remove leading "J" from the epoch string
  // MAIN-ID, SPTYPE, RA, DEC, RA2000, DEC2000, RA1950, DEC1950
  const simbad = await queryObjectById(OBJECT, EPOCH, EQUINOX)
  if (simbad.isErr()) {
    return err(simbad.error)
  }
  // Get observatory data (latitude, longitude and timezone)
  const observatoryData = await ResultAsync.fromPromise(
    trpc.observatory.get.query(OBSERVAT),
    () => new Error("Couldn't get observatory data"),
  )
  if (observatoryData.isErr()) return err(observatoryData.error)
  if (!observatoryData.value)
    return err(new Error(`Observatory "${OBSERVAT}" wasn't found`))
  const obsLongitude = observatoryData.value.longitude
  const obsTimezone = observatoryData.value.timezone
  // TIME-OBS
  const TIME_OBS = getLocalTime(DATE_OBS, UT, obsTimezone)
  const ST = await getSiderealTime(
    JD,
    obsLongitude,
    (mjd) => trpc.iers.getDeltaT.query(mjd),
    (mjd) => trpc.iers.getPolarMotion.query(mjd),
  )
  if (ST.isErr()) return err(ST.error)
  console.log({
    simbad,
    ob: observatoryData.value,
    TIME_OBS,
    JD,
    ST,
  })
  return ok()
}

/*
  OBJECT: $metadataStore.spectraData[bboxSelected - 2]["OBJECT"],
      OBSERVAT: $metadataStore.plateData["OBSERVAT"],
      "DATE-OBS": $metadataStore.spectraData[bboxSelected - 2]["DATE-OBS"],
      UT: $metadataStore.spectraData[bboxSelected - 2]["UT"],
      SUFFIX: $metadataStore.spectraData[bboxSelected - 2]["SUFFIX"],
  */

// http://tdc-www.harvard.edu/wcstools/wcstools.wcs.html
// RADECSYS     = 'FK4'

// Updater_mainId_ra2000_dec2000.update(metadata)
// Updater_SPTYPE.update(metadata)
// Updater_EQUINOX.update(metadata)
// Updater_EPOCH.update(metadata)

// Updater_RA_DEC.update(metadata)
// Updater_RA1950_DEC1950.update(metadata)
// Updater_TIMEOBS.update(metadata)
// Updater_ST.update(metadata)

// Updater_HA.update(metadata)
// Updater_AIRMASS.update(metadata)
// Updater_JD.update(metadata)

// -- Basic data from an object given one of its identifiers.
// SELECT basic.OID,
//        RA,
//        DEC,
//        main_id AS "Main identifier",
//        coo_bibcode AS "Coord Reference",
//        nbref AS "NbReferences",
//        plx_value as "Parallax",
//        rvz_radvel as "Radial velocity",
//        galdim_majaxis,
//        galdim_minaxis,
//        galdim_angle AS "Galaxy ellipse angle",
//        id
// FROM basic JOIN ident ON oidref = oid
// WHERE id = 'm13';

// SELECT
//   basic."main_id",
// basic."ra",
// basic."dec",
// basic."coo_err_maj",
// basic."coo_err_min",
// basic."coo_err_angle", basic."coo_wavelength", basic."coo_bibcode", ident."id" AS "matched_id"
// FROM basic JOIN ident ON basic."oid" = ident."oidref"
// WHERE id = 'M 82'
