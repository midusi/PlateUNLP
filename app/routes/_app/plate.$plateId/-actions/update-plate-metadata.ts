import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { getPlateMetadataCompletion, PlateMetadataSchema } from "~/types/spectrum-metadata"

export const updatePlateMetadata = createServerFn({ method: "POST" })
  .validator(
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
        OBSERVER: data.metadata.OBSERVER.value,
        "OBSERVER?": data.metadata.OBSERVER.isKnown,
        DIGITALI: data.metadata.DIGITALI.value,
        "DIGITALI?": data.metadata.DIGITALI.isKnown,
        SCANNER: data.metadata.SCANNER.value,
        "SCANNER?": data.metadata.SCANNER.isKnown,
        SOFTWARE: data.metadata.SOFTWARE.value,
        "SOFTWARE?": data.metadata.SOFTWARE.isKnown,
        TELESCOPE: data.metadata.TELESCOPE.value,
        "TELESCOPE?": data.metadata.TELESCOPE.isKnown,
        DETECTOR: data.metadata.DETECTOR.value,
        "DETECTOR?": data.metadata.DETECTOR.isKnown,
        INSTRUMENT: data.metadata.INSTRUMENT.value,
        "INSTRUMENT?": data.metadata.INSTRUMENT.isKnown,
      })
      .where(eq(s.plate.id, data.plateId))
  })
