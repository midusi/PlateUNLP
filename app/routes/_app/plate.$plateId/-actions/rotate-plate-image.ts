import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

const RotateDirectionSchema = z.enum(["left", "right"])

type ObservationBox = {
  id: string
  imageTop: number
  imageLeft: number
  imageWidth: number
  imageHeight: number
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360
}

function rotateBoundingBox90(
  box: ObservationBox,
  plateWidth: number,
  plateHeight: number,
  direction: z.infer<typeof RotateDirectionSchema>,
): Pick<ObservationBox, "imageTop" | "imageLeft" | "imageWidth" | "imageHeight"> {
  if (direction === "right") {
    return {
      imageLeft: plateHeight - (box.imageTop + box.imageHeight),
      imageTop: box.imageLeft,
      imageWidth: box.imageHeight,
      imageHeight: box.imageWidth,
    }
  }

  return {
    imageLeft: box.imageTop,
    imageTop: plateWidth - (box.imageLeft + box.imageWidth),
    imageWidth: box.imageHeight,
    imageHeight: box.imageWidth,
  }
}

export const rotatePlateImage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      plateId: z.string().min(1),
      direction: RotateDirectionSchema,
    }),
  )
  .handler(async ({ data }) => {
    return db.transaction(async (tx) => {
      const plate = await tx.query.plate.findFirst({
        where: (plate, { eq }) => eq(plate.id, data.plateId),
      })
      if (!plate) {
        throw new Error(`Plate with ID ${data.plateId} not found`)
      }

      const observations = await tx.query.observation.findMany({
        where: (observation, { eq }) => eq(observation.plateId, data.plateId),
        columns: {
          id: true,
          imageTop: true,
          imageLeft: true,
          imageWidth: true,
          imageHeight: true,
        },
      })

      const newRotation = normalizeDegrees(
        plate.imageRotation + (data.direction === "right" ? 90 : -90),
      )

      const newPlateWidth = plate.imageHeight
      const newPlateHeight = plate.imageWidth

      for (const observation of observations) {
        const rotated = rotateBoundingBox90(
          observation,
          plate.imageWidth,
          plate.imageHeight,
          data.direction,
        )
        await tx
          .update(s.observation)
          .set(rotated)
          .where(eq(s.observation.id, observation.id))
      }

      await tx
        .update(s.plate)
        .set({
          imageRotation: newRotation,
          imageWidth: newPlateWidth,
          imageHeight: newPlateHeight,
        })
        .where(eq(s.plate.id, data.plateId))

      return {
        rotation: newRotation,
        imageWidth: newPlateWidth,
        imageHeight: newPlateHeight,
        observations: observations.map((observation) => ({
          id: observation.id,
          ...rotateBoundingBox90(
            observation,
            plate.imageWidth,
            plate.imageHeight,
            data.direction,
          ),
        })),
      }
    })
  })
