import z from "zod"

/**
 * This schema defines the fields for teorical spectrum config form.
 */
export const TeoricalSpectrumConfigSchema = z
  .object({
    minWavelength: z.coerce.number().min(0, "Min wavelength must be positive"),
    maxWavelength: z.coerce.number().min(0, "Max wavelength must be positive"),
    material: z.string(),
    onlyOneLine: z.boolean(),
    inferenceFunction: z.string(),
    deegre: z.coerce.number().min(1, "Degre must be positive integer"),
  })
  .refine((data) => data.maxWavelength > data.minWavelength, {
    message: "Max wavelength must be greater than min wavelength",
    path: ["maxWavelength"],
  })
