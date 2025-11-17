import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, ne } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import { project, userToProject } from "~/db/schema"

export const updateProject = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string(),
      projectId: z.string().min(1),
      name: z.string().min(1),
      editors: z.array(z.string()),
      viewers: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    const { userId, projectId, name, editors, viewers } = data

    /** Asegurar que las de viewers no repita los usuarios editors */
    const sanitizedViewers = viewers.filter((userId) => !editors.includes(userId))

    /** Preparar los datos de nuevas relaciones en usersToProyects relaciòn */
    const newRelations = [
      ...editors.map((userId) => ({
        userId,
        projectId,
        role: "editor" as const, // Usa 'as const' para tipado literal
      })),
      ...sanitizedViewers.map((userId) => ({
        userId,
        projectId,
        role: "viewer" as const,
      })),
    ]

    await db.transaction(async (tx) => {
      /** 1. Actualizar el nombre del proyecto */
      await tx.update(project).set({ name: name }).where(eq(project.id, projectId))

      /** 2. Eliminar todas las relaciones existentes para este proyecto */
      await tx
        .delete(userToProject)
        .where(and(eq(userToProject.projectId, projectId), ne(userToProject.userId, userId)))

      /** 3. Insertar las nuevas relaciones */
      if (newRelations.length > 0) {
        await tx.insert(userToProject).values(newRelations)
      }
    })

    return { id: projectId, name, editors, viewers }
  })

export const updateProjectQueryOptions = (
  userId: string,
  projectId: string,
  name: string,
  editors: string[],
  viewers: string[],
) =>
  queryOptions({
    queryKey: ["update", "project", projectId, userId],
    queryFn: () => updateProject({ data: { userId, projectId, name, editors, viewers } }),
  })
