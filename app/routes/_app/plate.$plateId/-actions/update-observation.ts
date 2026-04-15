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

    const imageWidth = Math.min(data.imageWidth, observation.plate.imageWidth - data.imageLeft)
    const imageHeight = Math.min(data.imageHeight, observation.plate.imageHeight - data.imageTop)
    if (imageWidth <= 0 || data.imageLeft >= observation.plate.imageWidth) {
      throw new Error("Bounding box exceeds plate image width")
    }
    if (imageHeight <= 0 || data.imageTop >= observation.plate.imageHeight) {
      throw new Error("Bounding box exceeds plate image height")
    }

    await db
      .update(s.observation)
      .set({
        name: data.name,
        imageTop: data.imageTop,
        imageLeft: data.imageLeft,
        imageWidth,
        imageHeight,
      })
      .where(eq(s.observation.id, data.observationId))
  })
