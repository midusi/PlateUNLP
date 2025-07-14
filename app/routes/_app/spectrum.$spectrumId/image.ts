import { createServerFileRoute } from "@tanstack/react-start/server"
import sharp from "sharp"
import { db } from "~/db"
import { readUploadedFile } from "~/lib/uploads"

export const ServerRoute = createServerFileRoute("/_app/spectrum/$spectrumId/image").methods({
  GET: async ({ params }) => {
    const spectrum = await db.query.spectrum.findFirst({
      where: (t, { eq }) => eq(t.id, params.spectrumId),
      with: { observation: { with: { plate: { with: { image: true } } } } },
    })
    if (!spectrum) return new Response("Not found", { status: 404 })
    const plate = await readUploadedFile(spectrum.observation.plate.image.id)
    const result = await sharp(plate)
      .extract({
        height: Math.round(spectrum.imgHeight),
        top: Math.round(spectrum.imgTop),
        left: Math.round(spectrum.imgLeft),
        width: Math.round(spectrum.imgWidth),
      })
      .toBuffer()
    return new Response(result, {
      headers: {
        "Content-Type": spectrum.observation.plate.image.mimeType,
      },
    })
  },
})
