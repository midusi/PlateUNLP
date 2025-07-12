import { createServerFileRoute } from "@tanstack/react-start/server"
import sharp from "sharp"
import { db } from "~/db"
import { readUploadedFile } from "~/lib/uploads"

export const ServerRoute = createServerFileRoute("/_app/observation/$observationId/image").methods({
  GET: async ({ params }) => {
    const observation = await db.query.observation.findFirst({
      where: (t, { eq }) => eq(t.id, params.observationId),
      with: { plate: { with: { image: true } } },
    })
    if (!observation) return new Response("Not found", { status: 404 })
    const plate = await readUploadedFile(observation.plate.image.id)
    const result = await sharp(plate)
      .extract({
        height: observation.imgHeight,
        top: observation.imgTop,
        left: observation.imgLeft,
        width: observation.imgWidth,
      })
      .toBuffer()
    return new Response(result, {
      headers: {
        "Content-Type": observation.plate.image.mimeType,
      },
    })
  },
})
