import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { createAuthMiddleware } from "evlog/better-auth"
import { auth } from "~/lib/auth"
import { log } from "~/lib/log"

/**
 * Global server middleware: resolve the Better Auth session and tag the request's
 * wide event with the actor (id, role, …) on every server-function/SSR request.
 * Best-effort — identification never blocks the request.
 *
 * `auth`/`log` are referenced only inside `.server()`, so TanStack strips them
 * (and their server-only deps) from the client bundle, same as the `-actions`.
 */
export const evlogIdentifyMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    await createAuthMiddleware(auth)(log(), getRequestHeaders())
  } catch {
    // best-effort identification
  }
  return next()
})
