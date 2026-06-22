import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { z } from "zod"
import { auth } from "~/lib/auth"
import { log } from "~/lib/log"

export const createUser = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(1),
      username: z.string().min(3).max(30),
      email: z.email(),
      password: z.string().min(8),
      role: z.enum(["admin", "user"]),
    }),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const result = await auth.api.createUser({
      headers,
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        data: { username: data.username },
      },
    })
    log().set({ createdUser: { email: data.email, username: data.username, role: data.role } })
    log().info("admin created user")
    return result
  })
