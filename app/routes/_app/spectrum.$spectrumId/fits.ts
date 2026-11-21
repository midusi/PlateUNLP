import { createFileRoute } from "@tanstack/react-router"
import { db } from "~/db"
import { extractedSpectrumToFITS, observationToFITSFilename } from "~/lib/fits"
import { extractedSpectrumMetadata } from "~/lib/fits/from-db"

export const Route = createFileRoute("/_app/spectrum/$spectrumId/fits")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const spectrum = await db.query.spectrum.findFirst({
          where: (t, { eq }) => eq(t.id, params.spectrumId),
          with: {
            observation: {
              with: {
                plate: {
                  with: { observatory: true, project: true },
                },
              },
            },
          },
        })
        if (!spectrum) return new Response("Not found", { status: 404 })
        if (spectrum.intensityArr.length === 0) {
          return new Response("Spectrum extraction not found", { status: 400 })
        }

        const { observation } = spectrum
        const { plate } = observation
        const obsNameLabel = observation.OBJECT + "." + observation["OBS-N"]
        const fileName = observationToFITSFilename(
          plate["PLATE-N"],
          obsNameLabel,
          `${spectrum.type}.extracted`,
        )

        const fits = extractedSpectrumToFITS(
          spectrum.intensityArr,
          extractedSpectrumMetadata(plate, observation, fileName),
        )

        return new Response(fits.toBuffer(), {
          headers: {
            "Content-Type": "application/fits",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-store",
          },
        })
      },
    },
  },
})
