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
        imgTop: 0,
        imgLeft: 0,
        imgWidth: plate.imageWidth / 10,
        imgHeight: plate.imageHeight / 10,
      })
      .returning({
        id: s.observation.id,
        name: s.observation.name,
        imgTop: s.observation.imgTop,
        imgLeft: s.observation.imgLeft,
        imgWidth: s.observation.imgWidth,
        imgHeight: s.observation.imgHeight,
      })
    return observation
  })
