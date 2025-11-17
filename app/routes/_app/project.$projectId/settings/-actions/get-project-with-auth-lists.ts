import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

export const getProjectWithAuthLists = createServerFn()
  .inputValidator(z.object({ projectId: z.string() }))
  .handler(async ({ data }) => {
    const project = await db.query.project.findFirst({
      where: (t, { eq }) => eq(t.id, data.projectId),
      with: {
        projectToUsers: {
          columns: {
            userId: true,
            role: true,
          },
        },
      },
    })

    const usersRoles = project?.projectToUsers.map((u) => ({ id: u.userId, role: u.role }))

    return {
      id: project?.id,
      name: project?.name,
      permissions: usersRoles,
    }
  })

export const getProjectWithAuthListsQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ["project", "auth", "lists", projectId],
    queryFn: () => getProjectWithAuthLists({ data: { projectId } }),
  })
