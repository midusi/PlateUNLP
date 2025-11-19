import { createFileRoute } from "@tanstack/react-router"
import sharp from "sharp"
import { db } from "~/db"
import { bufferToArrayBuffer } from "~/lib/node"
import { readUploadedFile } from "~/lib/uploads"

export const Route = createFileRoute("/_app/plate/$plateId/preview")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const plate = await db.query.plate.findFirst({
          where: (t, { eq }) => eq(t.id, params.plateId),
          with: { image: true },
        })
        if (!plate) return new Response("Not found", { status: 404 })
        // Always convert to sRGB and PNG format for consistency
        let image = await readUploadedFile(plate.image.id)
        image = await sharp(image).toColorspace("srgb").png().toBuffer()
        return new Response(bufferToArrayBuffer(image), {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000", // Cache for 1 year
          },
        })
      },
    },
  },
})
