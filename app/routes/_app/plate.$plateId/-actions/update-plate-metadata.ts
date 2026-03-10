import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { getPlateMetadataCompletion, PlateMetadataSchema } from "~/types/spectrum-metadata"

export const updatePlateMetadata = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      plateId: z.string().min(1),
      metadata: PlateMetadataSchema.strip(),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .update(s.plate)
      .set({
        metadataCompletion: getPlateMetadataCompletion(data.metadata).percentage,
        OBSERVAT: data.metadata.OBSERVAT,
        "PLATE-N": data.metadata["PLATE-N"],
        TELESCOPE: data.metadata.TELESCOPE.value,
        "TELESCOPE?": data.metadata.TELESCOPE.isKnown,
        INSTRUMENT: data.metadata.INSTRUMENT.value,
        "INSTRUMENT?": data.metadata.INSTRUMENT.isKnown,
        OBSERVER: data.metadata.OBSERVER.value,
        "OBSERVER?": data.metadata.OBSERVER.isKnown,
        OBSNOTES: data.metadata.OBSNOTES.value,
        "OBSNOTES?": data.metadata.OBSNOTES.isKnown,
        NOTES: data.metadata.NOTES.value,
        "NOTES?": data.metadata.NOTES.isKnown,
        SCANNER: data.metadata.SCANNER.value,
        "SCANNER?": data.metadata.SCANNER.isKnown,
        SCANRES: data.metadata.SCANRES.value,
        "SCANRES?": data.metadata.SCANRES.isKnown,
        PIXSIZE: data.metadata.PIXSIZE.value,
        "PIXSIZE?": data.metadata.PIXSIZE.isKnown,
        SCANGAIN: data.metadata.SCANGAIN.value,
        "SCANGAIN?": data.metadata.SCANGAIN.isKnown,
        SCANSOFT: data.metadata.SCANSOFT.value,
        "SCANSOFT?": data.metadata.SCANSOFT.isKnown,
        DATESCAN: data.metadata.DATESCAN.value,
        "DATESCAN?": data.metadata.DATESCAN.isKnown,
        SCANAUTH: data.metadata.SCANAUTH.value,
        "SCANAUTH?": data.metadata.SCANAUTH.isKnown,
      })
      .where(eq(s.plate.id, data.plateId))
  })
