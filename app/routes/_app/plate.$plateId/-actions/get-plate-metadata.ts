import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import type { PlateMetadataSchema } from "~/types/spectrum-metadata"

export const getPlateMetadata = createServerFn()
  .inputValidator(z.object({ plateId: z.string() }))
  .handler(async ({ data }): Promise<z.infer<typeof PlateMetadataSchema>> => {
    const plate = await db.query.plate.findFirst({
      where: (plate, { eq }) => eq(plate.id, data.plateId),
    })
    if (!plate) {
      throw new Error(`Plate with ID ${data.plateId} not found`)
    }
    return {
      OBSERVAT: plate.OBSERVAT,
      "PLATE-N": plate["PLATE-N"],
      TELESCOPE: { value: plate.TELESCOPE, isKnown: plate["TELESCOPE?"] },
      INSTRUME: { value: plate.INSTRUME, isKnown: plate["INSTRUME?"] },
      OBSERVER: { value: plate.OBSERVER, isKnown: plate["OBSERVER?"] },
      OBSNOTES: { value: plate.OBSNOTES, isKnown: plate["OBSNOTES?"] },
      NOTES: { value: plate.NOTES, isKnown: plate["NOTES?"] },
      SCANNER: { value: plate.SCANNER, isKnown: plate["SCANNER?"] },
      SCANRES: { value: plate.SCANRES, isKnown: plate["SCANRES?"] },
      SCANGAIN: { value: plate.SCANGAIN, isKnown: plate["SCANGAIN?"] },
      SCANSOFT: { value: plate.SCANSOFT, isKnown: plate["SCANSOFT?"] },
      DATESCAN: { value: plate.DATESCAN, isKnown: plate["DATESCAN?"] },
      SCANAUTH: { value: plate.SCANAUTH, isKnown: plate["SCANAUTH?"] },
    }
  })

export const getPlateMetadataQueryOptions = (plateId: string) =>
  queryOptions({
    queryKey: ["plate", "metadata", plateId],
    queryFn: () => getPlateMetadata({ data: { plateId } }),
  })
