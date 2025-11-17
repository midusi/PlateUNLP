import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import { observation, plate, project, userToProject } from "~/db/schema"

export const getProjectsWithMetrics = createServerFn()
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const { userId } = data
    const projectsWithMetrics = await db
      .select({
        id: project.id,
        name: project.name,
        countPlates: sql<number>`COUNT(${plate.id})`,
        countObservations: sql<number>`COUNT(${observation.id})`,
      })
      .from(project)
      .innerJoin(
        userToProject,
        sql`${userToProject.projectId} = ${project.id} AND ${userToProject.userId} = ${userId}`,
      )
      .leftJoin(plate, sql`${plate.projectId} = ${project.id}`)
      .leftJoin(observation, sql`${observation.plateId} = ${plate.id}`)
      .where(sql`${userToProject.userId} = ${userId}`)
      .groupBy(project.id, project.name)
    return projectsWithMetrics
  })

export const getProjectsWithMetricsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["projects", "metrics", userId],
    queryFn: () => getProjectsWithMetrics({ data: { userId } }),
  })
