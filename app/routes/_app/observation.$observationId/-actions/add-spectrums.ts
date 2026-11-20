import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { storedOrientation } from "~/lib/oriented-box"
import { orientedBoxFields } from "~/types/oriented-box"

const SpectrumExtentSchema = z.object({
  imageTop: z.number().int().min(0),
  imageLeft: z.number().int().min(0),
  imageWidth: z.number().int().min(1),
  imageHeight: z.number().int().min(1),
  ...orientedBoxFields,
})

/** Columnas que se devuelven de cada espectro insertado. */
const returning = {
  id: s.spectrum.id,
  type: s.spectrum.type,
  imageTop: s.spectrum.imageTop,
  imageLeft: s.spectrum.imageLeft,
  imageWidth: s.spectrum.imageWidth,
  imageHeight: s.spectrum.imageHeight,
  imageAngle: s.spectrum.imageAngle,
}

/**
 * Añade 3 espectros (1 de ciencia y 2 de lampara de comparación) en la
 * base de datos.
 */
export const addSpectrums = createServerFn({ method: "POST" })
  .validator(
    z.object({
      observationId: z.string(),
      science: SpectrumExtentSchema,
      lamp1: SpectrumExtentSchema,
      lamp2: SpectrumExtentSchema,
    }),
  )
  .handler(async ({ data }) => {
    const observation = await db.query.observation.findFirst({
      where: (observation, { eq }) => eq(observation.id, data.observationId),
    })
    if (!observation) throw new Error(`Observation with id ${data.observationId} not found`)

    await db.delete(s.spectrum).where(eq(s.spectrum.observationId, data.observationId))

    const insert = async (type: "science" | "lamp", extent: z.infer<typeof SpectrumExtentSchema>) => {
      const [spectrum] = await db
        .insert(s.spectrum)
        .values({
          observationId: data.observationId,
          type,
          imageTop: extent.imageTop,
          imageLeft: extent.imageLeft,
          imageWidth: extent.imageWidth,
          imageHeight: extent.imageHeight,
          ...storedOrientation(extent),
        })
        .returning(returning)
      return spectrum
    }

    const science = await insert("science", data.science)
    const lamp1 = await insert("lamp", data.lamp1)
    const lamp2 = await insert("lamp", data.lamp2)
    return { science, lamp1, lamp2 }
  })
