import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "~/lib/auth"

export const listUsers = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders()
  const result = await auth.api.listUsers({ headers, query: {} })
  return result
})

export const listUsersQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "users"],
    queryFn: () => listUsers(),
  })
