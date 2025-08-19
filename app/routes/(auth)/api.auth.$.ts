import { createServerFileRoute } from "@tanstack/react-start/server"
import { auth } from "~/lib/auth" // import your auth instance

export const ServerRoute = createServerFileRoute("/(auth)/api/auth/$").methods({
  GET: ({ request }) => {
    return auth.handler(request)
  },
  POST: ({ request }) => {
    return auth.handler(request)
  },
})
