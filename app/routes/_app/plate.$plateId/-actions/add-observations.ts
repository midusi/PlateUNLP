import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const addObservations = createServerFn({ method: "POST" })
    .inputValidator(
        z.object({
            plateId: z.string(),
            resetExisting: z.boolean().optional().default(false),
            observations: z.array(
                z.object({
                    top: z.number().int().nonnegative(),
                    left: z.number().int().nonnegative(),
                    width: z.number().int().positive(),
                    height: z.number().int().positive(),
                })
            ),
        })
    )
  .handler(async ({ data }) => {
    const plate = await db.query.plate.findFirst({
      where: (plate, { eq }) => eq(plate.id, data.plateId),
    })
    if (!plate) throw new Error(`Plate with id ${data.plateId} not found`)

    /** Eliminar observaciones existentes (si se indica) */
    if (data.resetExisting) {
      await db
        .delete(s.observation)
        .where(eq(s.observation.plateId, data.plateId))
    }

    const values = data.observations.map((observation, idx) => {
        const width = Math.min(observation.width, plate.imageWidth - observation.left)
        const height = Math.min(observation.height, plate.imageHeight - observation.top)
        if (width <= 0 || observation.left >= plate.imageWidth) {
            throw new Error(`Bounding box ${idx} exceeds plate image width`)
        }
        if (height <= 0 || observation.top >= plate.imageHeight) {
            throw new Error(`Bounding box ${idx} exceeds plate image height`)
        }

        return {
            plateId: data.plateId,
            name: `Observation ${nanoid(4)}`,
            imageTop: observation.top,
            imageLeft: observation.left,
            imageWidth: width,
            imageHeight: height,
            metadataCompletion: 0,
        }
    })

    const observations = await db
      .insert(s.observation)
      .values(values)
      .returning({
        id: s.observation.id,
        name: s.observation.name,
        imageTop: s.observation.imageTop,
        imageLeft: s.observation.imageLeft,
        imageWidth: s.observation.imageWidth,
        imageHeight: s.observation.imageHeight,
      })

    return observations
  })