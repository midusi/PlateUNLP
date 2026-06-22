import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import { project, userToProject } from "~/db/schema"

export const updateProject = createServerFn({ method: "POST" })
  .validator(
    z.object({
      projectId: z.string().min(1),
      name: z.string().min(1),
      usersRoles: z.array(
        z.object({
          id: z.string().min(1),
          role: z.enum(["admin", "editor", "viewer"]),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    const { projectId, name, usersRoles } = data

    const newRelations = usersRoles.map((u) => ({
      userId: u.id,
      projectId,
      role: u.role,
    }))

    await db.transaction(async (tx) => {
      await tx.update(project).set({ name }).where(eq(project.id, projectId))
      await tx.delete(userToProject).where(eq(userToProject.projectId, projectId))
      if (newRelations.length > 0) {
        await tx.insert(userToProject).values(newRelations)
      }
    })

    return { id: projectId, name }
  })
