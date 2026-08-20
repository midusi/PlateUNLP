import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const deleteObservations = createServerFn({ method: "POST" })
  .validator(
    z.object({
      plateId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const result = await db
      .delete(s.observation)
      .where(eq(s.observation.plateId, data.plateId))
      .returning({ id: s.observation.id })

    return result
  })
