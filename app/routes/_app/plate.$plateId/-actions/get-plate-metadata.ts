import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import type { PlateMetadataSchema } from "~/types/spectrum-metadata"

export const getPlateMetadata = createServerFn()
  .validator(z.object({ plateId: z.string() }))
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
      OBSERVER: { value: plate.OBSERVER, isKnown: plate["OBSERVER?"] },
      DIGITALI: { value: plate.DIGITALI, isKnown: plate["DIGITALI?"] },
      SCANNER: { value: plate.SCANNER, isKnown: plate["SCANNER?"] },
      SOFTWARE: { value: plate.SOFTWARE, isKnown: plate["SOFTWARE?"] },
      TELESCOPE: { value: plate.TELESCOPE, isKnown: plate["TELESCOPE?"] },
      DETECTOR: { value: plate.DETECTOR, isKnown: plate["DETECTOR?"] },
      INSTRUMENT: { value: plate.INSTRUMENT, isKnown: plate["INSTRUMENT?"] },
    }
  })

export const getPlateMetadataQueryOptions = (plateId: string) =>
  queryOptions({
    queryKey: ["plate", "metadata", plateId],
    queryFn: () => getPlateMetadata({ data: { plateId } }),
  })
