import { defineHandler } from "nitro"
import { readUploadedFile } from "~/lib/uploads.server"

export default defineHandler(async (event) => {
  const uploadId = event.context.params?.uploadId
  if (!uploadId) return new Response("Bad request", { status: 400 })

  try {
    const buffer = await readUploadedFile(uploadId)
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
})
