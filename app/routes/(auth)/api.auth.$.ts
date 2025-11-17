import { createFileRoute } from "@tanstack/react-router"
import { auth } from "~/lib/auth" // import your auth instance

export const Route = createFileRoute("/(auth)/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return auth.handler(request)
      },
      POST: ({ request }) => {
        return auth.handler(request)
      },
    },
  },
})
