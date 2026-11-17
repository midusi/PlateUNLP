import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { ianaTimezone } from "~/types/utils"

export const updateObservatory = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        observatoryId: z.string().min(1),
        name: z.string().min(1).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        elevation: z.number().optional(),
        timezone: ianaTimezone().optional(),
        aliases: z.array(z.string().min(1)).optional(),
      })
      .refine(
        ({ observatoryId: _observatoryId, ...fields }) =>
          Object.values(fields).some((value) => value !== undefined),
        "At least one field to update is required",
      ),
  )
  .handler(async ({ data }) => {
    const observatory = await db.query.observatory.findFirst({
      where: (observatory, { eq }) => eq(observatory.id, data.observatoryId),
    })
    if (!observatory) throw new Error(`Observatory with id ${data.observatoryId} not found`)

    const updates: Partial<typeof s.observatory.$inferInsert> = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.elevation !== undefined && { elevation: data.elevation }),
      ...(data.timezone !== undefined && { timezone: data.timezone }),
      ...(data.aliases !== undefined && { aliases: data.aliases }),
    }

    const [updated] = await db
      .update(s.observatory)
      .set(updates)
      .where(eq(s.observatory.id, data.observatoryId))
      .returning()

    return updated
  })
