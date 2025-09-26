import z from "zod"

/**
 * This schema defines the fields for load lamp form.
 */
export const createLoadLampFormSchema = (existingNames: string[]) =>
  z
    .object({
      name: z.string().min(1, "Required"),
      file: z.instanceof(File, { message: "File is required" }),
    })
    .refine((data) => !existingNames.includes(data.name), {
      message: "This lamp name already exists",
      path: ["name"],
    })
    .refine((data) => data.file && data.file.size > 0, {
      message: "File is required",
      path: ["file"],
    })
