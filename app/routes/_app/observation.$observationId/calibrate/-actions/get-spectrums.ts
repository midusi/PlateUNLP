import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

export const getSpectrums = createServerFn()
  .validator(z.object({ observationId: z.string() }))
  .handler(async ({ data }) => {
    const spectrums = await db.query.spectrum.findMany({
      where: (spectrum, { eq }) => eq(spectrum.observationId, data.observationId),
      columns: {
        id: true,
        type: true,
        intensityArr: true,
      },
    })
    return spectrums
  })

export const getSpectrumsQueryOptions = (observationId: string) =>
  queryOptions({
    queryKey: ["spectrum", "list", "intensityArr", observationId],
    queryFn: () => getSpectrums({ data: { observationId } }),
  })
