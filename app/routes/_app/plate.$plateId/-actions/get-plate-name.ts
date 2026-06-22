import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"

const InputSchema = z.object({
  from: z.enum(["plate", "observation"]),
  id: z.string(),
})

export const getPlateName = createServerFn()
  .validator(InputSchema)
  .handler(async ({ data }) => {
    if (data.from === "plate") {
      const plate = await db.query.plate.findFirst({
        where: (t, { eq }) => eq(t.id, data.id),
        columns: { id: true, "PLATE-N": true },
      })
      if (plate) return plate
    } else if (data.from === "observation") {
      const observation = await db.query.observation.findFirst({
        where: (t, { eq }) => eq(t.id, data.id),
        columns: {},
        with: {
          plate: {
            columns: { id: true, "PLATE-N": true },
          },
        },
      })
      if (observation?.plate) return observation?.plate
    }

    throw new Error(`Could not find plate for ${data.from} with ID ${data.id}`)
  })

export const getPlateNameQueryOptions = (input: z.input<typeof InputSchema>) =>
  queryOptions({
    queryKey: ["plate", "name", input.from, input.id],
    queryFn: () => getPlateName({ data: input }),
  })
