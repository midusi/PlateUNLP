import type { GetSpectrumMetadataInput } from "./schema"
import { degToDMS, degToHMS } from "@/lib/format"
import { getBesselianEpoch, getJulianDate } from "./dates"
import { queryObjectById } from "./simbad"

export async function getSpectrumMetadata(input: GetSpectrumMetadataInput) {
  const { OBJECT } = input
  const JD = getJulianDate(input["DATE-OBS"], input.UT)
  const EPOCH = getBesselianEpoch(JD)
  const simbad = await queryObjectById(OBJECT, EPOCH)
  console.log({
    simbad,
    RA: simbad.success ? degToHMS(simbad.data.RA2000) : null,
    DEC: simbad.success ? degToDMS(simbad.data.DEC2000) : null,
  })
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
