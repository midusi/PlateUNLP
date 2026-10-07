import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { uploadAvatarFile } from "~/lib/uploads.server"

export const uploadAvatar = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(async ({ data }) => {
    const avatar = data.get("avatar")
    if (!(avatar instanceof File)) {
      return { success: false as const, error: "Missing avatar" }
    }

    const result = await uploadAvatarFile(avatar)
    if (result.isErr()) {
      return { success: false as const, error: result.error.message }
    }

    return { success: true as const, uploadId: result.value.id }
  })