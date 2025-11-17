import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import * as s from "~/db/schema"

export const updateCalibration = createServerFn()
  .validator(
    z.object({
      id: z.string(),
      minWavelength: z.number().min(0, "Min wavelength must be positive").optional(),
      maxWavelength: z.number().min(0, "Max wavelength must be positive").optional(),
      material: z.string().optional(),
      onlyOneLine: z.boolean().optional(),
      inferenceFunction: z
        .enum(["Linear regresion", "Piece wise linear regression", "Legendre"])
        .optional(),
      deegre: z.number().min(1, "Degre must be positive integer").optional(),
      materialPoints: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
      lampPoints: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const calibration = await db.query.calibration.findFirst({
      where: (calibration, { eq }) => eq(calibration.id, data.id),
      with: {
        observation: true,
      },
    })
    if (!calibration) throw new Error(`Calibration with id ${data.id} not found`)

    const updatedCalibration = await db
      .update(s.calibration)
      .set({
        minWavelength: data.minWavelength,
        maxWavelength: data.maxWavelength,
        material: data.material,
        onlyOneLine: data.onlyOneLine,
        inferenceFunction: data.inferenceFunction,
        deegre: data.deegre,
        materialPoints: data.materialPoints,
        lampPoints: data.lampPoints,
      })
      .where(eq(s.calibration.id, data.id))
      .returning({
        id: s.calibration.id,
        minWavelength: s.calibration.minWavelength,
        maxWavelength: s.calibration.maxWavelength,
        material: s.calibration.material,
        onlyOneLine: s.calibration.onlyOneLine,
        inferenceFunction: s.calibration.inferenceFunction,
        deegre: s.calibration.deegre,
        materialPoints: s.calibration.materialPoints,
        lampPoints: s.calibration.lampPoints,
      })
    return updatedCalibration[0]
  })
