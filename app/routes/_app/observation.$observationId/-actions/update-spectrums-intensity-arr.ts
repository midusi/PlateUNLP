import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateSpectrumsIntensityArr = createServerFn({ method: "POST" })
  .validator(
    z.array(
      z.object({
        id: z.string(),
        intensityArr: z.array(z.number()).min(1, "Must be at least 1 intensity data for save."),
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
              intensityArr: spec.intensityArr,
            })
            .where(eq(s.spectrum.id, spec.id)),
        ),
      )
    })
  })
