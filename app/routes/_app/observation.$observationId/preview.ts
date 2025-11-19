import { createFileRoute } from "@tanstack/react-router"
import sharp from "sharp"
import { db } from "~/db"
import { bufferToArrayBuffer } from "~/lib/node"
import { readUploadedFile } from "~/lib/uploads"

export const Route = createFileRoute("/_app/observation/$observationId/preview")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const observation = await db.query.observation.findFirst({
          where: (t, { eq }) => eq(t.id, params.observationId),
          with: { plate: { with: { image: true } } },
        })
        if (!observation) return new Response("Not found", { status: 404 })
        // Always convert to sRGB and PNG format for consistency
        let image = await readUploadedFile(observation.plate.image.id)
        image = await sharp(image)
          .extract({
            height: observation.imageHeight,
            top: observation.imageTop,
            left: observation.imageLeft,
            width: observation.imageWidth,
          })
          .toColorspace("srgb")
          .png()
          .toBuffer()
        return new Response(bufferToArrayBuffer(image), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        })
      },
    },
  },
})
