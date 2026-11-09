import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const deleteMaterial = createServerFn({ method: "POST" })
  .validator(
    z.object({
      materialId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const material = await db.query.material.findFirst({
      where: (material, { eq }) => eq(material.id, data.materialId),
      columns: { id: true, name: true },
    })
    if (!material) throw new Error(`Material with id ${data.materialId} not found`)

    const calibrationUsingIt = await db.query.calibration.findFirst({
      where: (calibration, { eq }) => eq(calibration.material, material.name),
      columns: { id: true },
    })

    if (calibrationUsingIt) {
      throw new Error(
        `Cannot delete material \"${material.name}\" because it is used by one or more calibrations`,
      )
    }

    const [deleted] = await db
      .delete(s.material)
      .where(eq(s.material.id, data.materialId))
      .returning({ id: s.material.id })

    return deleted
  })
