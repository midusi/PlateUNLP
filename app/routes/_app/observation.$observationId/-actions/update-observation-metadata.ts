import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import {
  getObservationMetadataCompletion,
  ObservationMetadataSchema,
} from "~/types/spectrum-metadata"

export const updateObservationMetadata = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      observationId: z.string().min(1),
      metadata: ObservationMetadataSchema.strip(),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .update(s.observation)
      .set({
        metadataCompletion: getObservationMetadataCompletion(data.metadata).percentage,
        OBJECT: data.metadata.OBJECT,
        "DATE-OBS": data.metadata["DATE-OBS"].value,
        "DATE-OBS?": data.metadata["DATE-OBS"].isKnown,
        UT: data.metadata.UT.value,
        "UT?": data.metadata.UT.isKnown,
        "MAIN-ID": data.metadata["MAIN-ID"].value,
        "MAIN-ID?": data.metadata["MAIN-ID"].isKnown,
        SPTYPE: data.metadata.SPTYPE.value,
        "SPTYPE?": data.metadata.SPTYPE.isKnown,
        RA: data.metadata.RA.value,
        "RA?": data.metadata.RA.isKnown,
        DEC: data.metadata.DEC.value,
        "DEC?": data.metadata.DEC.isKnown,
        EQUINOX: data.metadata.EQUINOX.value,
        "EQUINOX?": data.metadata.EQUINOX.isKnown,
        RA2000: data.metadata.RA2000.value,
        "RA2000?": data.metadata.RA2000.isKnown,
        DEC2000: data.metadata.DEC2000.value,
        "DEC2000?": data.metadata.DEC2000.isKnown,
        RA1950: data.metadata.RA1950.value,
        "RA1950?": data.metadata.RA1950.isKnown,
        DEC1950: data.metadata.DEC1950.value,
        "DEC1950?": data.metadata.DEC1950.isKnown,
        "TIME-OBS": data.metadata["TIME-OBS"].value,
        "TIME-OBS?": data.metadata["TIME-OBS"].isKnown,
        JD: data.metadata.JD.value,
        "JD?": data.metadata.JD.isKnown,
        ST: data.metadata.ST.value,
        "ST?": data.metadata.ST.isKnown,
        HA: data.metadata.HA.value,
        "HA?": data.metadata.HA.isKnown,
        AIRMASS: data.metadata.AIRMASS.value,
        "AIRMASS?": data.metadata.AIRMASS.isKnown,
        EXPTIME: data.metadata.EXPTIME.value,
        "EXPTIME?": data.metadata.EXPTIME.isKnown,
        IMAGETYP: data.metadata.IMAGETYP.value,
        "IMAGETYP?": data.metadata.IMAGETYP.isKnown,
      })
      .where(eq(s.observation.id, data.observationId))
  })
