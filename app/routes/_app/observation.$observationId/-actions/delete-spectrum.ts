import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const deleteSpectrum = createServerFn({ method: "POST" })
  .validator(
    z.object({
      spectrumId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const result = await db
      .delete(s.spectrum)
      .where(eq(s.spectrum.id, data.spectrumId))
      .returning({ id: s.spectrum.id })

    if (result.length === 0) {
      throw new Error(`Spectrum with id ${data.spectrumId} not found`)
    }

    return result[0]
  })
