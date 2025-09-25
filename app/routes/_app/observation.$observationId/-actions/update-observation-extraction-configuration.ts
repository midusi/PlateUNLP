import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateObservationExtractionConfiguration = createServerFn({ method: "POST" })
  .validator(
    z.object({
      observationId: z.string().min(1),
      countMediasPoints: z.number().min(2).optional(),
      apertureCoefficient: z.number().min(0.01).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .update(s.observation)
      .set({
        countMediasPoints: data.countMediasPoints,
        apertureCoefficient: data.apertureCoefficient,
      })
      .where(eq(s.observation.id, data.observationId))
  })
