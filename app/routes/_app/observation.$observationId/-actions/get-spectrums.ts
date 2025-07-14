import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

export const getSpectrums = createServerFn()
  .validator(z.object({ observationId: z.string() }))
  .handler(async ({ data }) => {
    const getSpectrums = await db.query.spectrum.findMany({
      where: (spectrum, { eq }) => eq(spectrum.observationId, data.observationId),
      columns: {
        id: true,
        type: true,
        imgTop: true,
        imgLeft: true,
        imgWidth: true,
        imgHeight: true,
      },
    })
    return getSpectrums
  })

export const getSpectrumsQueryOptions = (observationId: string) =>
  queryOptions({
    queryKey: ["spectrums", observationId],
    queryFn: () => getSpectrums({ data: { observationId } }),
  })
