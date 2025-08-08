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
    // Always convert to 16-bit grayscale for consistency
    let image = await readUploadedFile(observation.plate.image.id)
    image = await sharp(image)
      .extract({
        height: observation.imageHeight,
        top: observation.imageTop,
        left: observation.imageLeft,
        width: observation.imageWidth,
      })
      .toColorspace("b-w")
      .extractChannel(0)
      .raw({ depth: "ushort" }) // ushort for 16-bit
      .toBuffer()
    return new Response(image, {
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Image-Width": String(observation.imageWidth),
        "X-Image-Height": String(observation.imageHeight),
      },
    })
  },
})
