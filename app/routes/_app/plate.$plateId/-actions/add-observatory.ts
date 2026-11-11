import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const addObservatory = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      elevation: z.number(),
      timezone: z.string().min(1),
      aliases: z.array(z.string().min(1)).optional(),
      source: z.enum(["astropy-data", "plateunlp", "user"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const [observatory] = await db
        .insert(s.observatory)
        .values({
          id: data.id,
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          elevation: data.elevation,
          timezone: data.timezone,
          aliases: data.aliases ?? [],
          source: data.source ?? "user",
        })
        .returning()

      return observatory
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
        throw new Error(`Observatory with id "${data.id}" already exists`)
      }
      throw err
    }
  })
