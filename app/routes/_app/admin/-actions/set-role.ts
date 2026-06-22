import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { z } from "zod"
import { auth } from "~/lib/auth"
import { log } from "~/lib/log"

export const setUserRole = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userId: z.string().min(1),
      role: z.enum(["admin", "user"]),
    }),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    log().set({ targetUser: { id: data.userId }, role: data.role })
    const result = await auth.api.setRole({
      headers,
      body: { userId: data.userId, role: data.role },
    })
    log().info("admin changed user role")
    return result
  })
