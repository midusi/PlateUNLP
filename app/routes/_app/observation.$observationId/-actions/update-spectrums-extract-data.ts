import { createServerFn } from "@tanstack/react-start"
import { eq, inArray } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateSpectrumsExtractData = createServerFn({ method: "POST" })
  .validator(
    z.array(
      z.object({
        spectrumId: z.string(),
        type: z.enum(["lamp", "science"]).optional(),
        countMediasPoints: z.number().int().min(1, "Must be at least 1.").optional(),
        apertureCoefficient: z.number().min(0.01, "Must be positive").optional(),
        intensityArr: z
          .array(z.number())
          .min(1, "Must be at least 1 intensity data for save.")
          .optional(),
      }),
    ),
  )
  .handler(async ({ data: updateSpecArr }) => {
    await db.transaction(async (tx) => {
      await Promise.all(
        updateSpecArr.map((spec) =>
          tx
            .update(s.spectrum)
            .set({
              ...(spec.type !== undefined && { type: spec.type }),
              ...(spec.countMediasPoints !== undefined && {
                countMediasPoints: spec.countMediasPoints,
              }),
              ...(spec.apertureCoefficient !== undefined && {
                apertureCoefficient: spec.apertureCoefficient,
              }),
              ...(spec.intensityArr !== undefined && {
                intensityArr: spec.intensityArr,
              }),
            })
            .where(eq(s.spectrum.id, spec.spectrumId)),
        ),
      )
    })
  })
