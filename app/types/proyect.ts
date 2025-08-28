import z from "zod"

/**
 * This schema defines the fields for new proyect form.
 */
export const NewProyectSchema = z
  .object({
    name: z.string().min(1),
    existingProjectsNames: z.array(z.string()),
    usersRoles: z.array(
      z.object({ id: z.string().min(1), role: z.enum(["owner", "editor", "viewer"]) }),
    ),
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
    oldUsersRoles: z.array(
      z.object({ id: z.string().min(1), role: z.enum(["owner", "editor", "viewer"]) }),
    ),
    otherProjectsNames: z.array(z.string()),
    name: z.string().min(1),
    usersRoles: z.array(
      z.object({ id: z.string().min(1), role: z.enum(["owner", "editor", "viewer"]) }),
    ),
  })
  .refine((data) => !data.otherProjectsNames.includes(data.name), {
    message: "Project name already exists",
    path: ["name"],
  })
  .refine(
    (data) =>
      data.name !== data.oldName ||
      JSON.stringify(data.usersRoles.sort()) !== JSON.stringify(data.oldUsersRoles.sort()),
    {
      message: "No changes detected",
      path: ["name"], // Puedes asociar el mensaje de error a un campo específico
    },
  )
