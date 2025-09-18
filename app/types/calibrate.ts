import z from "zod"

/**
 * This schema defines the fields for teorical spectrum config form.
 */
export const TeoricalSpectrumConfigSchema = z
  .object({
    minWavelength: z.number().min(0, "Min wavelength must be positive"),
    maxWavelength: z.number().min(0, "Max wavelength must be positive"),
    material: z.string(),
    onlyOneLine: z.boolean(),
    inferenceFunction: z.string(),
    deegre: z.number().min(1, "Degre must be positive integer"),
    materialPoints: z.array(z.object({ x: z.number(), y: z.number() })),
    lampPoints: z.array(z.object({ x: z.number(), y: z.number() })),
  })
  .refine((data) => data.maxWavelength > data.minWavelength, {
    message: "Max wavelength must be greater than min wavelength",
    path: ["maxWavelength"],
  })
