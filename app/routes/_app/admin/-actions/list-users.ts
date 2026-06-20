import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "~/lib/auth"

export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders()
  const { users, total } = await auth.api.listUsers({ headers, query: {} })
  return {
    total,
    users: users as ((typeof users)[number] & { username?: string })[], // https://github.com/better-auth/better-auth/pull/9952
  }
})

export const listUsersQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "users"],
    queryFn: () => listUsers(),
  })
