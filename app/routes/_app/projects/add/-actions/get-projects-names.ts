import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import { project } from "~/db/schema"

export const getProjectsNames = createServerFn()
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const projectsWithMetrics = await db
      .select({
        id: project.id,
        name: project.name,
      })
      .from(project)
    return projectsWithMetrics
  })

export const getProjectsNamesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["projects", "names", userId],
    queryFn: () => getProjectsNames({ data: { userId } }),
  })
