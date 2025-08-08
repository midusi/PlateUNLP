import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const addSpectrum = createServerFn({ method: "POST" })
  .validator(
    z.object({
      observationId: z.string(),
      top: z.number().int().nonnegative(),
      left: z.number().int().nonnegative(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const observation = await db
      .select({
        id: s.observation.id,
        imageHeight: s.observation.imageHeight,
        imageWidth: s.observation.imageWidth,
        spectrumCount: db.$count(s.spectrum, eq(s.spectrum.observationId, s.observation.id)),
      })
      .from(s.observation)
      .where(eq(s.observation.id, data.observationId))
      .get()
    if (!observation) throw new Error(`Observation with id ${data.observationId} not found`)

    if (
      data.top + data.width > observation.imageWidth ||
      data.left + data.height > observation.imageHeight
    ) {
      throw new Error("Bounding box exceeds observation dimensions")
    }

    const [spectrum] = await db
      .insert(s.spectrum)
      .values({
        observationId: data.observationId,
        type: observation.spectrumCount === 0 ? "science" : "lamp",
        imageTop: data.top,
        imageLeft: data.left,
        imageWidth: data.width,
        imageHeight: data.height,
      })
      .returning({
        id: s.spectrum.id,
        type: s.spectrum.type,
        imageTop: s.spectrum.imageTop,
        imageLeft: s.spectrum.imageLeft,
        imageWidth: s.spectrum.imageWidth,
        imageHeight: s.spectrum.imageHeight,
      })
    return spectrum
  })
