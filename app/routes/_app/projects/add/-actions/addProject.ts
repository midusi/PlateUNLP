import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import { project, userToProject } from "~/db/schema"

export const addProject = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string().min(1), name: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { userId, name } = data
    const [newProject] = await db.insert(project).values({ name: name }).returning({
      id: project.id,
      name: project.name,
    })
    await db.insert(userToProject).values({
      projectId: newProject.id,
      userId,
      role: "owner",
    })
    return newProject
  })

export const addProjectQueryOptions = (userId: string, name: string) =>
  queryOptions({
    queryKey: ["add", "project", userId, name],
    queryFn: () => addProject({ data: { userId, name } }),
  })
