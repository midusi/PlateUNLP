import z from "zod"

/**
 * This schema defines the fields for new proyect form.
 */
export const NewProyectSchema = z
  .object({
    name: z.string().min(1),
    existingProjectsNames: z.array(z.string()),
    editors: z.array(z.string()),
    viewers: z.array(z.string()),
  })
  .refine((data) => !data.existingProjectsNames.includes(data.name), {
    message: "Project name already exists",
    path: ["name"],
  })
