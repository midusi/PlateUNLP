import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

export const getProject = createServerFn()
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data }) => {
    const project = await db.query.project.findFirst({
      where: (t, { eq }) => eq(t.id, data.projectId),
      with: { plates: true },
    })
    return project
  })

export const getProjectQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ["project", "detail", projectId],
    queryFn: () => getProject({ data: { projectId } }),
  })
