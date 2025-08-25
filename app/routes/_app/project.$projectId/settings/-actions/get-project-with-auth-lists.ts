import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

export const getProjectWithAuthLists = createServerFn()
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data }) => {
    const project = await db.query.project.findFirst({
      where: (t, { eq }) => eq(t.id, data.projectId),
      with: {
        projectToUsers: {
            columns: {
                userId: true,
                role: true
            }
        }
      },
    })

    const editors = project?.projectToUsers.filter(u => u.role === "editor").map(u => u.userId)
    const viewers = project?.projectToUsers.filter(u => u.role === "viewer").map(u => u.userId)

    return {
        id: project?.id,
        name: project?.name,
        editors,
        viewers,
    }
  })

export const getProjectWithAuthListsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ["project", "auth", "lists", projectId],
    queryFn: () => getProjectWithAuthLists({ data: { projectId } }),
  })
