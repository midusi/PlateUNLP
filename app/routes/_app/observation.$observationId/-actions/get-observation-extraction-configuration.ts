import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const getObservationExtractionConfiguration = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      observationId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const result = await db
      .select({
        countMediasPoints: s.observation.countMediasPoints,
        apertureCoefficient: s.observation.apertureCoefficient,
      })
      .from(s.observation)
      .where(eq(s.observation.id, data.observationId))
    return result[0] ?? null
  })
