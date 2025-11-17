import { createServerFn } from "@tanstack/react-start"
import { nanoid } from "nanoid"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const addObservation = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      plateId: z.string(),
      top: z.number().int().nonnegative(),
      left: z.number().int().nonnegative(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const plate = await db.query.plate.findFirst({
      where: (plate, { eq }) => eq(plate.id, data.plateId),
    })
    if (!plate) throw new Error(`Plate with id ${data.plateId} not found`)

    if (data.left + data.width > plate.imageWidth) {
      throw new Error("Bounding box exceeds plate image width")
    }
    if (data.top + data.height > plate.imageHeight) {
      throw new Error("Bounding box exceeds plate image height")
    }

    const [observation] = await db
      .insert(s.observation)
      .values({
        plateId: data.plateId,
        name: `Observation ${nanoid(4)}`,
        imageTop: data.top,
        imageLeft: data.left,
        imageWidth: data.width,
        imageHeight: data.height,
        metadataCompletion: 0,
      })
      .returning({
        id: s.observation.id,
        name: s.observation.name,
        imageTop: s.observation.imageTop,
        imageLeft: s.observation.imageLeft,
        imageWidth: s.observation.imageWidth,
        imageHeight: s.observation.imageHeight,
      })
    return observation
  })
