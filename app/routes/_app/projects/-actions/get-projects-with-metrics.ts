import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import { observation, plate, project } from "~/db/schema"

export const getProjectsWithMetrics = createServerFn()
  .validator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const projectsWithMetrics = await db
      .select({
        id: project.id,
        name: project.name,
        countPlates: sql<number>`COUNT(${plate.id})`,
        countObservations: sql<number>`COUNT(${observation.id})`,
      })
      .from(project)
      .leftJoin(plate, sql`${plate.projectId} = ${project.id}`)
      .leftJoin(observation, sql`${observation.plateId} = ${plate.id}`)
      .groupBy(project.id, project.name)
    return projectsWithMetrics
  })

export const getProjectsWithMetricsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["projects", "metrics", userId],
    queryFn: () => getProjectsWithMetrics({ data: { userId } }),
  })
