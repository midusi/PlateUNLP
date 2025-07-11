import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { ObservationMetadataSchema } from "~/types/spectrum-metadata"

export const updateObservationMetadata = createServerFn({ method: "POST" })
  .validator(
    z.object({
      observationId: z.string().min(1),
      metadata: ObservationMetadataSchema.strip(),
    }),
  )
  .handler(async ({ data }) => {
    await db
      .update(s.observation)
      .set({ ...data.metadata })
      .where(eq(s.observation.id, data.observationId))
  })
