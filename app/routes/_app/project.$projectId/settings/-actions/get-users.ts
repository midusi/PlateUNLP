import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { sql } from "drizzle-orm"
import { z } from "zod"
import { db } from "~/db"
import { user } from "~/db/schema"

export const getUsers = createServerFn()
  .validator(z.object({}))
  .handler(async ({ data: _ }) => {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        image: user.image,
        email: user.email,
      })
      .from(user)
    return users
  })

export const getUsersQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["get", "users"],
    queryFn: () => getUsers({ data: {} }),
  })
