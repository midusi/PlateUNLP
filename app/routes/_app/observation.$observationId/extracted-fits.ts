import { createFileRoute } from "@tanstack/react-router"
import JSZip from "jszip"
import { db } from "~/db"
import { extractedSpectrumToFITS, observationToFITSFilename } from "~/lib/fits"
import { extractedSpectrumMetadata } from "~/lib/fits/from-db"

// Ruta que devuelve un .zip con un FITS 1D (las intensidades extraidas) por cada espectro.
export const Route = createFileRoute("/_app/observation/$observationId/extracted-fits")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const observation = await db.query.observation.findFirst({
          where: (t, { eq }) => eq(t.id, params.observationId),
          with: {
            plate: {
              with: { observatory: true, project: true },
            },
            spectra: true,
          },
        })
        if (!observation) return new Response("Not found", { status: 404 })

        // Solo los espectros ya extraidos, de arriba hacia abajo en la observacion.
        const extracted = [...observation.spectra]
          .filter((spectrum) => spectrum.intensityArr.length > 0)
          .sort((a, b) => a.imageTop - b.imageTop || a.imageLeft - b.imageLeft)
        if (extracted.length === 0) {
          return new Response("No extracted spectra found", { status: 400 })
        }

        const { plate } = observation
        const obsNameLabel = `${observation.OBJECT}.${observation["OBS-N"]}`

        // Cada archivo se llama [placa].[obs].[tipo][-1|-2].extracted.fits. Se numera el tipo
        // solo cuando hay mas de un espectro de ese tipo (p. ej. dos lamparas).
        const totalByType = new Map<string, number>()
        for (const spectrum of extracted) {
          totalByType.set(spectrum.type, (totalByType.get(spectrum.type) ?? 0) + 1)
        }
        const seenByType = new Map<string, number>()

        const zip = new JSZip()
        for (const spectrum of extracted) {
          const seen = (seenByType.get(spectrum.type) ?? 0) + 1
          seenByType.set(spectrum.type, seen)
          const typeLabel =
            (totalByType.get(spectrum.type) ?? 1) > 1 ? `${spectrum.type}-${seen}` : spectrum.type

          const fileName = observationToFITSFilename(
            plate["PLATE-N"],
            obsNameLabel,
            `${typeLabel}.extracted`,
          )
          const fits = extractedSpectrumToFITS(
            spectrum.intensityArr,
            extractedSpectrumMetadata(plate, observation, fileName),
          )
          zip.file(fileName, fits.toBuffer())
        }

        const zipName = `${observationToFITSFilename(plate["PLATE-N"], obsNameLabel, "extracted", false)}.zip`
        const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })

        return new Response(new Uint8Array(content), {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${zipName}"`,
            "Cache-Control": "no-store",
          },
        })
      },
    },
  },
})
