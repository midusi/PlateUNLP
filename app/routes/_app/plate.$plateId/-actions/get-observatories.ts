import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { sql } from "drizzle-orm"
import { db } from "~/db"

export const getObservatories = createServerFn().handler(async () => {
  return db.query.observatory.findMany({
    columns: { id: true, name: true, latitude: true, longitude: true, elevation: true, timezone: true, aliases: true, source: true },
    orderBy: (t, { asc }) => asc(sql`lower(${t.name})`),
  })
})

export const getObservatoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["observatory", "list"],
    queryFn: () => getObservatories(),
  })
