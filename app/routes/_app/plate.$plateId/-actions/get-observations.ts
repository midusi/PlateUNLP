import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

export type Observation = Awaited<ReturnType<typeof getObservations>>[number]

export const getObservations = createServerFn()
  .inputValidator(z.object({ plateId: z.string() }))
  .handler(async ({ data }) => {
    const observations = await db.query.observation.findMany({
      where: (observation, { eq }) => eq(observation.plateId, data.plateId),
      columns: {
        id: true,
        name: true,
        imageTop: true,
        imageLeft: true,
        imageWidth: true,
        imageHeight: true,
      },
    })
    return observations
  })

export const getObservationsQueryOptions = (plateId: string) =>
  queryOptions({
    queryKey: ["observation", "list", plateId],
    queryFn: () => getObservations({ data: { plateId } }),
  })
