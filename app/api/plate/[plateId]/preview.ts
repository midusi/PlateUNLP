import { defineHandler } from "nitro"
import { getPlatePreviewResponse } from "~/lib/plate-preview"

export default defineHandler((event) => {
  const plateId = event.context.params?.plateId
  if (!plateId) return new Response("Bad request", { status: 400 })

  return getPlatePreviewResponse(event.req, plateId)
})
