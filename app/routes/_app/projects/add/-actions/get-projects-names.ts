import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import { project, userToProject } from "~/db/schema"

export const getProjectsNames = createServerFn()
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const { userId } = data
    const projectsNames = await db
      .select({
        id: project.id,
        name: project.name,
      })
      .from(project)
      .innerJoin(
        userToProject,
        sql`${userToProject.projectId} = ${project.id} AND ${userToProject.userId} = ${userId}`,
      )

    return projectsNames
  })

export const getProjectsNamesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["projects", "names", userId],
    queryFn: () => getProjectsNames({ data: { userId } }),
  })
