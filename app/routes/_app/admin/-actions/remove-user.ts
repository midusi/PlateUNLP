import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { z } from "zod"
import { auth } from "~/lib/auth"

export const removeUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    return await auth.api.removeUser({
      headers,
      body: { userId: data.userId },
    })
  })
