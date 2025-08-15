import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateSpectrum = createServerFn()
  .validator(
    z.object({
      spectrumId: z.string(),
      imageTop: z.number().min(0),
      imageLeft: z.number().min(0),
      imageWidth: z.number().min(1),
      imageHeight: z.number().min(1),
      type: z.enum(["lamp", "science"]).optional(),
      countMediasPoints: z.number().int().min(1, "Must be at least 1.").optional(),
      apertureCoefficient: z.number().min(0.01, "Must be positive").optional(),
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

    if (data.imageLeft + data.imageWidth > spectrum.observation.imageWidth) {
      throw new Error("Bounding box exceeds plate image width")
    }
    if (data.imageTop + data.imageHeight > spectrum.observation.imageHeight) {
      throw new Error("Bounding box exceeds plate image height")
    }
    await db
      .update(s.spectrum)
      .set({
        imageTop: data.imageTop,
        imageLeft: data.imageLeft,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        ...(data.type !== undefined && { type: data.type }),
        ...(data.countMediasPoints !== undefined && { countMediasPoints: data.countMediasPoints }),
        ...(data.apertureCoefficient !== undefined && {
          apertureCoefficient: data.apertureCoefficient,
        }),
      })
      .where(eq(s.spectrum.id, data.spectrumId))
  })
