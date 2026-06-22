import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

const InputSchema = z.object({
  from: z.enum(["project", "plate", "observation"]),
  id: z.string(),
})

export const getProjectName = createServerFn()
  .validator(InputSchema)
  .handler(async ({ data }) => {
    if (data.from === "project") {
      const project = await db.query.project.findFirst({
        where: (t, { eq }) => eq(t.id, data.id),
        columns: { id: true, name: true },
      })
      if (project) return project
    } else if (data.from === "plate") {
      const plate = await db.query.plate.findFirst({
        where: (t, { eq }) => eq(t.id, data.id),
        columns: {},
        with: {
          project: {
            columns: { id: true, name: true },
          },
        },
      })
      if (plate?.project) return plate?.project
    } else if (data.from === "observation") {
      const observation = await db.query.observation.findFirst({
        where: (t, { eq }) => eq(t.id, data.id),
        columns: {},
        with: {
          plate: {
            columns: {},
            with: {
              project: {
                columns: { id: true, name: true },
              },
            },
          },
        },
      })
      if (observation?.plate.project) return observation?.plate.project
    }

    throw new Error(`Could not find project for ${data.from} with ID ${data.id}`)
  })

export const getProjectNameQueryOptions = (input: z.input<typeof InputSchema>) =>
  queryOptions({
    queryKey: ["project", "name", input.from, input.id],
    queryFn: () => getProjectName({ data: input }),
  })
