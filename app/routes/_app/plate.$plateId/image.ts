import { createServerFileRoute } from "@tanstack/react-start/server"
import { db } from "~/db"
import { readUploadedFile } from "~/lib/uploads"

export const ServerRoute = createServerFileRoute("/_app/plate/$plateId/image").methods({
  GET: async ({ params }) => {
    const plate = await db.query.plate.findFirst({
      where: (t, { eq }) => eq(t.id, params.plateId),
      with: { image: true },
    })
    if (!plate) return new Response("Not found", { status: 404 })
    return new Response(await readUploadedFile(plate.image.id), {
      headers: {
        "Content-Type": plate.image.mimeType,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    })
  },
})
