import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const deleteObservation = createServerFn({ method: "POST" })
  .validator(
    z.object({
      observationId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const result = await db
      .delete(s.observation)
      .where(eq(s.observation.id, data.observationId))
      .returning({ id: s.observation.id })

    if (result.length === 0) {
      throw new Error(`Observation with id ${data.observationId} not found`)
    }

    return result[0]
  })
