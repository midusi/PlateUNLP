import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { storedOrientation } from "~/lib/oriented-box"
import { orientedBoxFields } from "~/types/oriented-box"
import { FIT_DEGREE_MAX, FIT_DEGREE_MIN } from "~/types/spectrum-metadata"

export const updateSpectrum = createServerFn()
  .validator(
    z.object({
      spectrumId: z.string(),
      imageTop: z.number().int().min(0).optional(),
      imageLeft: z.number().int().min(0).optional(),
      imageWidth: z.number().int().min(1).optional(),
      imageHeight: z.number().int().min(1).optional(),
      ...orientedBoxFields,
      countMediasPoints: z.number().int().min(1).optional(),
      apertureCoefficient: z.number().min(0).max(1.5).optional(),
      fitDegree: z.number().int().min(FIT_DEGREE_MIN).max(FIT_DEGREE_MAX).optional(),
      type: z.enum(["lamp", "science"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const spectrum = await db.query.spectrum.findFirst({
      where: (spectrum, { eq }) => eq(spectrum.id, data.spectrumId),
      with: {
        observation: true,
      },
    })
    if (!spectrum) throw new Error(`Spectrum with id ${data.spectrumId} not found`)

    const nextLeft = data.imageLeft ?? spectrum.imageLeft
    const nextWidth = data.imageWidth ?? spectrum.imageWidth
    const nextTop = data.imageTop ?? spectrum.imageTop
    const nextHeight = data.imageHeight ?? spectrum.imageHeight

    if (nextLeft + nextWidth > spectrum.observation.imageWidth) {
      throw new Error("Bounding box exceeds plate image width")
    }
    if (nextTop + nextHeight > spectrum.observation.imageHeight) {
      throw new Error("Bounding box exceeds plate image height")
    }

    /**
     * Si cambia el rectangulo, el angulo que tenia guardado deja de valer: se
     * reemplaza por el que llega, o la caja vuelve a ser el rectangulo.
     */
    const rectChanged =
      data.imageTop !== undefined ||
      data.imageLeft !== undefined ||
      data.imageWidth !== undefined ||
      data.imageHeight !== undefined ||
      data.imageAngle !== undefined

    const updates: Partial<typeof s.spectrum.$inferInsert> = {
      ...(rectChanged &&
        storedOrientation(data)),
      ...(data.imageTop !== undefined && { imageTop: data.imageTop }),
      ...(data.imageLeft !== undefined && { imageLeft: data.imageLeft }),
      ...(data.imageWidth !== undefined && { imageWidth: data.imageWidth }),
      ...(data.imageHeight !== undefined && { imageHeight: data.imageHeight }),
      ...(data.apertureCoefficient !== undefined && {
        apertureCoefficient: data.apertureCoefficient,
      }),
      ...(data.countMediasPoints !== undefined && {
        countMediasPoints: data.countMediasPoints,
      }),
      ...(data.fitDegree !== undefined && { fitDegree: data.fitDegree }),
      ...(data.type !== undefined && { type: data.type }),
    }

    await db
      .update(s.spectrum)
      .set(updates)
      .where(eq(s.spectrum.id, data.spectrumId))
  })
