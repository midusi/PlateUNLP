import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { nanoid } from "nanoid"
import { z } from "zod"
import { auth } from "~/lib/auth"

export const resetPassword = createServerFn({ method: "POST" })
  .validator(z.object({ userId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const newPassword = nanoid(20)
    await auth.api.setUserPassword({
      headers,
      body: { userId: data.userId, newPassword },
    })
    return { newPassword }
  })
