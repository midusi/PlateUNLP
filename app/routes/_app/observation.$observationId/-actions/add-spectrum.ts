import { createServerFn } from "@tanstack/react-start"
import { nanoid } from "nanoid"
import { z } from "zod/v4"
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
        imgTop: 0,
        imgLeft: 0,
        imgWidth: observation.imgWidth / 10,
        imgHeight: observation.imgHeight / 10,
      })
      .returning({
        id: s.spectrum.id,
        type: s.spectrum.type,
        imgTop: s.spectrum.imgTop,
        imgLeft: s.spectrum.imgLeft,
        imgWidth: s.spectrum.imgWidth,
        imgHeight: s.spectrum.imgHeight,
      })
    return spectrum
  })
