import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

/**
 * Añade 3 espectros (1 de ciencia y 2 de lampara de comparación) en la
 * base de datos.
 */
export const addSpectrums = createServerFn({ method: "POST" })
  .validator(
    z.object({
      observationId: z.string(),
      science: z.object({
        imgTop: z.number().min(0),
        imgLeft: z.number().min(0),
        imgWidth: z.number().min(1),
        imgHeight: z.number().min(1),
      }),
      lamp1: z.object({
        imgTop: z.number().min(0),
        imgLeft: z.number().min(0),
        imgWidth: z.number().min(1),
        imgHeight: z.number().min(1),
      }),
      lamp2: z.object({
        imgTop: z.number().min(0),
        imgLeft: z.number().min(0),
        imgWidth: z.number().min(1),
        imgHeight: z.number().min(1),
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
        imgTop: sc.imgTop,
        imgLeft: sc.imgLeft,
        imgWidth: sc.imgWidth,
        imgHeight: sc.imgHeight,
      })
      .returning({
        id: s.spectrum.id,
        type: s.spectrum.type,
        imgTop: s.spectrum.imgTop,
        imgLeft: s.spectrum.imgLeft,
        imgWidth: s.spectrum.imgWidth,
        imgHeight: s.spectrum.imgHeight,
      })
    const [newLamp1] = await db
      .insert(s.spectrum)
      .values({
        observationId: data.observationId,
        type: "lamp",
        imgTop: l1.imgTop,
        imgLeft: l1.imgLeft,
        imgWidth: l1.imgWidth,
        imgHeight: l1.imgHeight,
      })
      .returning({
        id: s.spectrum.id,
        type: s.spectrum.type,
        imgTop: s.spectrum.imgTop,
        imgLeft: s.spectrum.imgLeft,
        imgWidth: s.spectrum.imgWidth,
        imgHeight: s.spectrum.imgHeight,
      })
    const [newLamp2] = await db
      .insert(s.spectrum)
      .values({
        observationId: data.observationId,
        type: "lamp",
        imgTop: l2.imgTop,
        imgLeft: l2.imgLeft,
        imgWidth: l2.imgWidth,
        imgHeight: l2.imgHeight,
      })
      .returning({
        id: s.spectrum.id,
        type: s.spectrum.type,
        imgTop: s.spectrum.imgTop,
        imgLeft: s.spectrum.imgLeft,
        imgWidth: s.spectrum.imgWidth,
        imgHeight: s.spectrum.imgHeight,
      })

    return { science: newScience, lamp1: newLamp1, lamp2: newLamp2 }
  })
