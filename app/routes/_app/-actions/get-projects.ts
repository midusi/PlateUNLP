import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

export const getProjects = createServerFn()
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const project = await db.query.project.findMany()
    return project
  })

export const getProjectsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["project", "list", userId],
    queryFn: () => getProjects({ data: { userId } }),
  })
