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

 /**
 * This schema defines the fields for edit proyect form.
 */
export const EditProyectSchema = z
  .object({
    oldName: z.string().min(1),
    oldEditors: z.array(z.string()),
    oldViewers: z.array(z.string()),
    existingProjectsNames: z.array(z.string()),
    name: z.string().min(1),
    editors: z.array(z.string()),
    viewers: z.array(z.string()),
  })
  .refine((data) => !data.existingProjectsNames.includes(data.name), {
    message: "Project name already exists",
    path: ["name"],
  })
  .refine(
    (data) =>
      data.name !== data.oldName ||
      JSON.stringify(data.editors.sort()) !== JSON.stringify(data.oldEditors.sort()) ||
      JSON.stringify(data.viewers.sort()) !== JSON.stringify(data.oldViewers.sort()),
    {
      message: "No changes detected",
      path: ["name"], // Puedes asociar el mensaje de error a un campo específico
    }
  );
