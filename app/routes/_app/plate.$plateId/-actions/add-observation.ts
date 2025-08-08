import { createServerFn } from "@tanstack/react-start"
import { nanoid } from "nanoid"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const addObservation = createServerFn({ method: "POST" })
  .validator(z.object({ plateId: z.string() }))
  .handler(async ({ data }) => {
    const plate = await db.query.plate.findFirst({
      where: (plate, { eq }) => eq(plate.id, data.plateId),
    })
    if (!plate) throw new Error(`Plate with id ${data.plateId} not found`)

    const [observation] = await db
      .insert(s.observation)
      .values({
        plateId: data.plateId,
        name: `Observation ${nanoid(4)}`,
        imageTop: 0,
        imageLeft: 0,
        imageWidth: plate.imageWidth / 10,
        imageHeight: plate.imageHeight / 10,
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
