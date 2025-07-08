import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateSpectrum = createServerFn()
  .validator(
    z.object({
      spectrumId: z.string(),
      imgTop: z.number().min(0),
      imgLeft: z.number().min(0),
      imgWidth: z.number().min(1),
      imgHeight: z.number().min(1),
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

    if (data.imgLeft + data.imgWidth > spectrum.observation.imgWidth) {
      throw new Error("Bounding box exceeds plate image width")
    }
    if (data.imgTop + data.imgHeight > spectrum.observation.imgHeight) {
      throw new Error("Bounding box exceeds plate image height")
    }

    await db
      .update(s.spectrum)
      .set({
        imgTop: data.imgTop,
        imgLeft: data.imgLeft,
        imgWidth: data.imgWidth,
        imgHeight: data.imgHeight,
      })
      .where(eq(s.spectrum.id, data.spectrumId))
  })
