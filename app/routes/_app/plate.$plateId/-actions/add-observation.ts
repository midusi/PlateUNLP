import { createServerFn } from "@tanstack/react-start"
import { eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { nextObsN } from "~/lib/obs-n"

export const addObservation = createServerFn({ method: "POST" })
  .validator(
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

    const width = Math.min(data.width, plate.imageWidth - data.left)
    const height = Math.min(data.height, plate.imageHeight - data.top)
    if (width <= 0 || data.left >= plate.imageWidth) {
      throw new Error("Bounding box exceeds plate image width")
    }
    if (height <= 0 || data.top >= plate.imageHeight) {
      throw new Error("Bounding box exceeds plate image height")
    }

    const [{ maxObsN }] = await db
      .select({ maxObsN: sql<string | null>`MAX(${s.observation["OBS-N"]})` })
      .from(s.observation)
      .where(eq(s.observation.plateId, data.plateId))

    const [observation] = await db
      .insert(s.observation)
      .values({
        plateId: data.plateId,
        name: `Observation ${nanoid(4)}`,
        imageTop: data.top,
        imageLeft: data.left,
        imageWidth: width,
        imageHeight: height,
        metadataCompletion: 0,
        "OBS-N": nextObsN(maxObsN),
      })
      .returning({
        id: s.observation.id,
        name: s.observation.name,
        "OBS-N": s.observation["OBS-N"],
        imageTop: s.observation.imageTop,
        imageLeft: s.observation.imageLeft,
        imageWidth: s.observation.imageWidth,
        imageHeight: s.observation.imageHeight,
      })
    return observation
  })
