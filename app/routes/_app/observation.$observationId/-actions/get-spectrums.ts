import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import { spectrum as spectrumTable } from "~/db/schema"

export const getSpectrums = createServerFn()
  .validator(z.object({ observationId: z.string() }))
  .handler(async ({ data }) => {
    const spectrums = await db.query.spectrum.findMany({
      where: (spectrum, { eq }) => eq(spectrum.observationId, data.observationId),
      columns: {
        id: true,
        type: true,
        imageTop: true,
        imageLeft: true,
        imageWidth: true,
        imageHeight: true,
        countMediasPoints: true,
        apertureCoefficient: true,
        fitDegree: true,
      },
      extras: {
        extractedLength: sql<number>`json_array_length(${spectrumTable.intensityArr})`.as(
          "extracted_length",
        ),
      },
    })
    return spectrums
  })

export const getSpectrumsQueryOptions = (observationId: string) =>
  queryOptions({
    queryKey: ["spectrum", "list", observationId],
    queryFn: () => getSpectrums({ data: { observationId } }),
  })
