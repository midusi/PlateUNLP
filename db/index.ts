import { drizzle } from "drizzle-orm/libsql"

import { env } from "~/env"
import * as schema from "./schema"

export const db = drizzle({
  connection: env.RAILPACK_BUILDING
    ? { url: "file:./tmp.sqlite" }
    : { url: env.DATABASE_URL, authToken: env.DATABASE_TOKEN },
  schema,
  casing: "snake_case",
})
