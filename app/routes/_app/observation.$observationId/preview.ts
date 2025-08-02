import { createServerFileRoute } from "@tanstack/react-start/server"
import sharp from "sharp"
import { db } from "~/db"
import { readUploadedFile } from "~/lib/uploads"

export const ServerRoute = createServerFileRoute(
  "/_app/observation/$observationId/preview",
).methods({
  GET: async ({ params }) => {
    const observation = await db.query.observation.findFirst({
      where: (t, { eq }) => eq(t.id, params.observationId),
      with: { plate: { with: { image: true } } },
    })
    if (!observation) return new Response("Not found", { status: 404 })
    // Always convert to sRGB and PNG format for consistency
    let image = await readUploadedFile(observation.plate.image.id)
    image = await sharp(image).toColorspace("srgb").png().toBuffer()
    return new Response(image, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    })
  },
})
