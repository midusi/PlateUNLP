import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod/v4"
import { db } from "~/db"

export const getObservations = createServerFn()
  .validator(z.object({ plateId: z.string() }))
  .handler(async ({ data }) => {
    const observations = await db.query.observation.findMany({
      where: (observation, { eq }) => eq(observation.plateId, data.plateId),
      columns: {
        id: true,
        name: true,
        imgTop: true,
        imgLeft: true,
        imgWidth: true,
        imgHeight: true,
      },
    })
    return observations
  })

export const getObservationsQueryOptions = (plateId: string) =>
  queryOptions({
    queryKey: ["observations", plateId],
    queryFn: () => getObservations({ data: { plateId } }),
  })
