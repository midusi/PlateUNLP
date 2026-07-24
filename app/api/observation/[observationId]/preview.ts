import { defineHandler } from "nitro"
import { getObservationPreviewResponse } from "~/lib/observation-preview"

export default defineHandler((event) => {
  const observationId = event.context.params?.observationId
  if (!observationId) return new Response("Bad request", { status: 400 })

  return getObservationPreviewResponse(event.req, observationId)
})
