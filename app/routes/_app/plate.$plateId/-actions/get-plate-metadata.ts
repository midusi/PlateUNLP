import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

export const getPlateMetadata = createServerFn()
  .validator(z.object({ plateId: z.string() }))
  .handler(async ({ data }) => {
    const plate = await db.query.plate.findFirst({
      where: (plate, { eq }) => eq(plate.id, data.plateId),
      columns: {
        OBSERVAT: true,
        "PLATE-N": true,
        OBSERVER: true,
        DIGITALI: true,
        SCANNER: true,
        SOFTWARE: true,
        TELESCOPE: true,
        DETECTOR: true,
        INSTRUMENT: true,
      },
    })
    if (!plate) {
      throw new Error(`Plate with ID ${data.plateId} not found`)
    }
    return plate
  })

export const getPlateMetadataQueryOptions = (plateId: string) =>
  queryOptions({
    queryKey: ["plate", "metadata", plateId],
    queryFn: () => getPlateMetadata({ data: { plateId } }),
  })
