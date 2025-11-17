import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

/**
 * Añade 3 espectros (1 de ciencia y 2 de lampara de comparación) en la
 * base de datos.
 */
export const addSpectrums = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      observationId: z.string(),
      science: z.object({
        imageTop: z.number().min(0),
        imageLeft: z.number().min(0),
        imageWidth: z.number().min(1),
        imageHeight: z.number().min(1),
      }),
      lamp1: z.object({
        imageTop: z.number().min(0),
        imageLeft: z.number().min(0),
        imageWidth: z.number().min(1),
        imageHeight: z.number().min(1),
      }),
      lamp2: z.object({
        imageTop: z.number().min(0),
        imageLeft: z.number().min(0),
        imageWidth: z.number().min(1),
        imageHeight: z.number().min(1),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const observation = await db.query.observation.findFirst({
      where: (observation, { eq }) => eq(observation.id, data.observationId),
    })
    if (!observation) throw new Error(`Observation with id ${data.observationId} not found`)

    const { science: sc, lamp1: l1, lamp2: l2 } = data
    const [newScience] = await db
      .insert(s.spectrum)
      .values({
        observationId: data.observationId,
        type: "science",
        imageTop: sc.imageTop,
        imageLeft: sc.imageLeft,
        imageWidth: sc.imageWidth,
        imageHeight: sc.imageHeight,
      })
      .returning({
        id: s.spectrum.id,
        type: s.spectrum.type,
        imageTop: s.spectrum.imageTop,
        imageLeft: s.spectrum.imageLeft,
        imageWidth: s.spectrum.imageWidth,
        imageHeight: s.spectrum.imageHeight,
      })
    const [newLamp1] = await db
      .insert(s.spectrum)
      .values({
        observationId: data.observationId,
        type: "lamp",
        imageTop: l1.imageTop,
        imageLeft: l1.imageLeft,
        imageWidth: l1.imageWidth,
        imageHeight: l1.imageHeight,
      })
      .returning({
        id: s.spectrum.id,
        type: s.spectrum.type,
        imageTop: s.spectrum.imageTop,
        imageLeft: s.spectrum.imageLeft,
        imageWidth: s.spectrum.imageWidth,
        imageHeight: s.spectrum.imageHeight,
      })
    const [newLamp2] = await db
      .insert(s.spectrum)
      .values({
        observationId: data.observationId,
        type: "lamp",
        imageTop: l2.imageTop,
        imageLeft: l2.imageLeft,
        imageWidth: l2.imageWidth,
        imageHeight: l2.imageHeight,
      })
      .returning({
        id: s.spectrum.id,
        type: s.spectrum.type,
        imageTop: s.spectrum.imageTop,
        imageLeft: s.spectrum.imageLeft,
        imageWidth: s.spectrum.imageWidth,
        imageHeight: s.spectrum.imageHeight,
      })

    return { science: newScience, lamp1: newLamp1, lamp2: newLamp2 }
  })
