import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateSpectrumsTypes = createServerFn({ method: "POST" })
  .inputValidator(
    z.array(
      z.object({
        id: z.string(),
        type: z.enum(["lamp", "science"]),
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
            })
            .where(eq(s.spectrum.id, spec.id)),
        ),
      )
    })
  })
