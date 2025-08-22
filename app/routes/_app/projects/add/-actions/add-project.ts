import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import { project, userToProject } from "~/db/schema"

export const addProject = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string().min(1),
      name: z.string().min(1),
      editors: z.array(z.string()),
      viewers: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    const { userId, name, editors, viewers } = data
    const [newProject] = await db.insert(project).values({ name: name }).returning({
      id: project.id,
      name: project.name,
    })

    /** Listado de relaciones con usuarios a agregar */
    const roles: { userId: string; projectId: string; role: "owner" | "editor" | "viewer" }[] = [
      { userId, projectId: newProject.id, role: "owner" },
      ...editors.map((id) => ({ userId: id, projectId: newProject.id, role: "editor" as const })),
      ...viewers.map((id) => ({ userId: id, projectId: newProject.id, role: "viewer" as const })),
    ]

    await db.insert(userToProject).values(roles)

    return newProject
  })

export const addProjectQueryOptions = (
  userId: string,
  name: string,
  editors: string[],
  viewers: string[],
) =>
  queryOptions({
    queryKey: ["add", "project", userId, name],
    queryFn: () => addProject({ data: { userId, name, editors, viewers } }),
  })
