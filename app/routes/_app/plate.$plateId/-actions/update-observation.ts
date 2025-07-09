import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod/v4"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateObservation = createServerFn()
  .validator(
    z.object({
      observationId: z.string(),
      name: z.string().min(1),
      imgTop: z.int().min(0),
      imgLeft: z.int().min(0),
      imgWidth: z.int().min(1),
      imgHeight: z.int().min(1),
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

    if (data.imgLeft + data.imgWidth > observation.plate.imageWidth) {
      throw new Error("Bounding box exceeds plate image width")
    }
    if (data.imgTop + data.imgHeight > observation.plate.imageHeight) {
      throw new Error("Bounding box exceeds plate image height")
    }

    await db
      .update(s.observation)
      .set({
        name: data.name,
        imgTop: data.imgTop,
        imgLeft: data.imgLeft,
        imgWidth: data.imgWidth,
        imgHeight: data.imgHeight,
      })
      .where(eq(s.observation.id, data.observationId))
  })
