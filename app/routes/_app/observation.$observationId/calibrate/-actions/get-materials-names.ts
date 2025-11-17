import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { db } from "~/db"

export const getMaterialsNames = createServerFn().handler(async () => {
  const materials = await db.query.material.findMany({
    columns: {
      name: true,
    },
  })
  return materials.map((m) => m.name)
})

export const getMaterialsNamesQueryOptions = () =>
  queryOptions({
    queryKey: ["get", "material", "names"],
    queryFn: () => getMaterialsNames(),
  })
