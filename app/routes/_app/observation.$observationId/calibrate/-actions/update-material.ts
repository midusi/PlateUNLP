import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateMaterial = createServerFn({ method: "POST" })
  .validator(
    z.object({
      materialId: z.string().min(1),
      name: z.string().min(1).optional(),
      arr: z
        .array(
          z.object({
            wavelength: z.number(),
            material: z.string(),
            intensity: z.number(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const material = await db.query.material.findFirst({
      where: (material, { eq }) => eq(material.id, data.materialId),
      columns: { id: true, name: true },
    })
    if (!material) throw new Error(`Material with id ${data.materialId} not found`)

    try {
      return await db.transaction(async (tx) => {
        if (data.name !== undefined && data.name !== material.name) {
          await tx
            .update(s.calibration)
            .set({ material: data.name })
            .where(eq(s.calibration.material, material.name))
        }

        const [updatedMaterial] = await tx
          .update(s.material)
          .set({
            ...(data.name !== undefined && { name: data.name }),
            ...(data.arr !== undefined && { arr: data.arr }),
          })
          .where(eq(s.material.id, data.materialId))
          .returning({
            id: s.material.id,
            name: s.material.name,
            arr: s.material.arr,
          })

        return updatedMaterial
      })
    } catch (err) {
      if (err instanceof Error && err.message.includes("UNIQUE constraint failed")) {
        throw new Error(`Material with name \"${data.name}\" already exists`)
      }
      throw err
    }
  })
