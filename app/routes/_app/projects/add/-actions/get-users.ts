import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { db } from "~/db"
import { user } from "~/db/schema"

export const getUsers = createServerFn().handler(async () => {
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

export const getUsersQueryOptions = () =>
  queryOptions({
    queryKey: ["get", "users"],
    queryFn: () => getUsers(),
  })
