import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateObservation = createServerFn()
  .inputValidator(
    z.object({
      observationId: z.string(),
      name: z.string().min(1),
      imageTop: z.int().min(0),
      imageLeft: z.int().min(0),
      imageWidth: z.int().min(1),
      imageHeight: z.int().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const observation = await db.query.observation.findFirst({
      where: (observation, { eq }) => eq(observation.id, data.observationId),
      with: {
        plate: true,
      },
    })
    if (!observation) throw new Error(`Observation with id ${data.observationId} not found`)

    if (data.imageLeft + data.imageWidth > observation.plate.imageWidth) {
      throw new Error("Bounding box exceeds plate image width")
    }
    if (data.imageTop + data.imageHeight > observation.plate.imageHeight) {
      throw new Error("Bounding box exceeds plate image height")
    }

    await db
      .update(s.observation)
      .set({
        name: data.name,
        imageTop: data.imageTop,
        imageLeft: data.imageLeft,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
      })
      .where(eq(s.observation.id, data.observationId))
  })
