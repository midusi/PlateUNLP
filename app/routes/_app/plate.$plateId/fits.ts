import { createFileRoute } from "@tanstack/react-router"
import sharp from "sharp"
import { db } from "~/db"
import { plateToFITS, plateToFITSFilename, unknownable } from "~/lib/fits"
import { readUploadedFile } from "~/lib/uploads"

export const Route = createFileRoute("/_app/plate/$plateId/fits")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const plate = await db.query.plate.findFirst({
          where: (t, { eq }) => eq(t.id, params.plateId),
          with: { image: true, observatory: true, project: true },
        })
        if (!plate) return new Response("Not found", { status: 404 })
        const fileName = plateToFITSFilename(plate["PLATE-N"])

        let image = await readUploadedFile(plate.image.id)
        image = await sharp(image)
          .rotate(plate.imageRotation)
          .toColorspace("b-w")
          .extractChannel(0)
          .raw({ depth: "ushort" })
          .toBuffer()

        const pixels = new Uint16Array(
          image.buffer,
          image.byteOffset,
          image.byteLength / Uint16Array.BYTES_PER_ELEMENT,
        )
        const fits = plateToFITS(pixels, {
          width: plate.imageWidth,
          height: plate.imageHeight,
          metadata: {
            fileName,
            origin: plate.project.name,
            plateNumber: plate["PLATE-N"],
            observatory: plate.OBSERVAT,
            telescope: unknownable(plate.TELESCOPE, plate["TELESCOPE?"]),
            instrument: unknownable(plate.INSTRUME, plate["INSTRUME?"]),
            detector: unknownable(plate.DETECTOR, plate["DETECTOR?"]),
            observer: unknownable(plate.OBSERVER, plate["OBSERVER?"]),
            observerNotes: unknownable(plate.OBSNOTES, plate["OBSNOTES?"]),
            plateNotes: unknownable(plate.PLATNOTE, plate["PLATNOTE?"]),
            scanner: unknownable(plate.SCANNER, plate["SCANNER?"]),
            scanResolution: unknownable(plate.SCANRES, plate["SCANRES?"]),
            scanGain: unknownable(plate.SCANGAIN, plate["SCANGAIN?"]),
            scanSoftware: unknownable(plate.SCANSOFT, plate["SCANSOFT?"]),
            dateScan: unknownable(plate.DATESCAN, plate["DATESCAN?"]),
            scanAuthor: unknownable(plate.SCANAUTH, plate["SCANAUTH?"]),
            scannerNotes: unknownable(plate.SCANNOTE, plate["SCANNOTE?"]),
          },
        })

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
