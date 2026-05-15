import { createServerFn } from "@tanstack/react-start"
import { eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"
import { obsNFromIndex, obsNToIndex } from "~/lib/obs-n"

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

    const [{ maxObsN }] = await db
      .select({ maxObsN: sql<string | null>`MAX(${s.observation["OBS-N"]})` })
      .from(s.observation)
      .where(eq(s.observation.plateId, data.plateId))

    const startIndex = maxObsN ? obsNToIndex(maxObsN) + 1 : 0

    const sortedObservations = data.observations
      .map((obs, originalIdx) => ({ obs, originalIdx }))
      .sort((a, b) => a.obs.top - b.obs.top || a.obs.left - b.obs.left)

    const values = sortedObservations.map(({ obs, originalIdx }, sortedIdx) => {
        const width = Math.min(obs.width, plate.imageWidth - obs.left)
        const height = Math.min(obs.height, plate.imageHeight - obs.top)
        if (width <= 0 || obs.left >= plate.imageWidth) {
            throw new Error(`Bounding box ${originalIdx} exceeds plate image width`)
        }
        if (height <= 0 || obs.top >= plate.imageHeight) {
            throw new Error(`Bounding box ${originalIdx} exceeds plate image height`)
        }

        return {
            plateId: data.plateId,
            name: `Observation ${nanoid(4)}`,
            imageTop: obs.top,
            imageLeft: obs.left,
            imageWidth: width,
            imageHeight: height,
            metadataCompletion: 0,
            "OBS-N": obsNFromIndex(startIndex + sortedIdx),
        }
    })

    const observations = await db
      .insert(s.observation)
      .values(values)
      .returning({
        id: s.observation.id,
        name: s.observation.name,
        "OBS-N": s.observation["OBS-N"],
        imageTop: s.observation.imageTop,
        imageLeft: s.observation.imageLeft,
        imageWidth: s.observation.imageWidth,
        imageHeight: s.observation.imageHeight,
      })

    return observations
  })