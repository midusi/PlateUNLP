import { createFileRoute } from "@tanstack/react-router"
import sharp from "sharp"
import { db } from "~/db"
import { plateToFITS, plateToFITSFilename } from "~/lib/fits"
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
            observatory: plate.observatory.name,
            telescope: plate["TELESCOPE?"] ? plate.TELESCOPE : undefined,
            instrument: plate["INSTRUME?"] ? plate.INSTRUME : undefined,
            observer: plate["OBSERVER?"] ? plate.OBSERVER : undefined,
            observerNotes: plate["OBSNOTES?"] ? plate.OBSNOTES : undefined,
            notes: plate["NOTES?"] ? plate.NOTES : undefined,
            scanner: plate["SCANNER?"] ? plate.SCANNER : undefined,
            scanResolution: plate["SCANRES?"] ? plate.SCANRES : undefined,
            scanGain: plate["SCANGAIN?"] ? plate.SCANGAIN : undefined,
            scanSoftware: plate["SCANSOFT?"] ? plate.SCANSOFT : undefined,
            dateScan: plate["DATESCAN?"] ? plate.DATESCAN : undefined,
            scanAuthor: plate["SCANAUTH?"] ? plate.SCANAUTH : undefined,
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
