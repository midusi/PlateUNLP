import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const addSpectrum = createServerFn({ method: "POST" })
  .validator(z.object({ observationId: z.string() }))
  .handler(async ({ data }) => {
    const observation = await db.query.observation.findFirst({
      where: (observation, { eq }) => eq(observation.id, data.observationId),
    })
    if (!observation) throw new Error(`Observation with id ${data.observationId} not found`)

    const [spectrum] = await db
      .insert(s.spectrum)
      .values({
        observationId: data.observationId,
        type: "lamp",
        imageTop: 0,
        imageLeft: 0,
        imageWidth: observation.imageWidth / 10,
        imageHeight: observation.imageHeight / 10,
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
