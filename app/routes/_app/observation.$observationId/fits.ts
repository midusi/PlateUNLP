import { createFileRoute } from "@tanstack/react-router"
import sharp from "sharp"
import { db } from "~/db"
import { observationToFITSFilename, spectrumCropToFITS } from "~/lib/fits"
import { readUploadedFile } from "~/lib/uploads"

export const Route = createFileRoute("/_app/observation/$observationId/fits")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const observation = await db.query.observation.findFirst({
          where: (t, { eq }) => eq(t.id, params.observationId),
          with: {
            plate: {
              with: { image: true, observatory: true, project: true },
            },
          },
        })
        if (!observation) return new Response("Not found", { status: 404 })

        const { plate } = observation
        const fileName = observationToFITSFilename(
          plate["PLATE-N"],
          observation.OBJECT,
          "observation",
        )

        let image = await readUploadedFile(plate.image.id)
        image = await sharp(image)
          .rotate(plate.imageRotation)
          .extract({
            height: observation.imageHeight,
            top: observation.imageTop,
            left: observation.imageLeft,
            width: observation.imageWidth,
          })
          .toColorspace("b-w")
          .extractChannel(0)
          .raw({ depth: "ushort" })
          .toBuffer()

        const pixels = new Uint16Array(
          image.buffer,
          image.byteOffset,
          image.byteLength / Uint16Array.BYTES_PER_ELEMENT,
        )

        const fits = spectrumCropToFITS(pixels, {
          width: observation.imageWidth,
          height: observation.imageHeight,
          metadata: {
            fileName,
            origin: plate.project.name,
            plateNumber: plate["PLATE-N"],
            observatory: plate.OBSERVAT,
            observatoryTimezone: plate.observatory.timezone,
            telescope: plate["TELESCOPE?"] ? plate.TELESCOPE : undefined,
            observerNotes: plate["OBSNOTES?"] ? plate.OBSNOTES : undefined,
            plateNotes: plate["PLATNOTE?"] ? plate.PLATNOTE : undefined,
            scanner: plate["SCANNER?"] ? plate.SCANNER : undefined,
            scanResolution: plate["SCANRES?"] ? plate.SCANRES : undefined,
            scanGain: plate["SCANGAIN?"] ? plate.SCANGAIN : undefined,
            scanSoftware: plate["SCANSOFT?"] ? plate.SCANSOFT : undefined,
            dateScan: plate["DATESCAN?"] ? plate.DATESCAN : undefined,
            scanAuthor: plate["SCANAUTH?"] ? plate.SCANAUTH : undefined,
            scannerNotes: plate["SCANNOTE?"] ? plate.SCANNOTE : undefined,
            observer: plate["OBSERVER?"] ? plate.OBSERVER : undefined,
            instrument: plate["INSTRUME?"] ? plate.INSTRUME : undefined,
            detector: plate["DETECTOR?"] ? plate.DETECTOR : undefined,
            obsN: observation["OBS-N"] || undefined,
            objectNotes: observation["OBJNOTES?"] ? observation.OBJNOTES : undefined,
            object: observation["OBJECT?"] ? observation.OBJECT : undefined,
            dateObs: observation["DATE-OBS?"] ? observation["DATE-OBS"] : undefined,
            dateOrg: observation["DATE-ORG?"] ? observation["DATE-ORG"] : undefined,
            exptime: observation["EXPTIME?"] ? observation.EXPTIME : undefined,
            imageType: observation["IMAGETYP?"] ? observation.IMAGETYP : undefined,
            mainId: observation["MAIN-ID?"] ? observation["MAIN-ID"] : undefined,
            spectralType: observation["SPTYPE?"] ? observation.SPTYPE : undefined,
            ra: observation["RA?"] ? observation.RA : undefined,
            dec: observation["DEC?"] ? observation.DEC : undefined,
            epoch: observation["EQUINOX?"] ? observation.EQUINOX : undefined,
            equinox: observation["EQUINOX?"] ? observation.EQUINOX : undefined,
            ra2000: observation["RA2000?"] ? observation.RA2000 : undefined,
            dec2000: observation["DEC2000?"] ? observation.DEC2000 : undefined,
            ra1950: observation["RA1950?"] ? observation.RA1950 : undefined,
            dec1950: observation["DEC1950?"] ? observation.DEC1950 : undefined,
            jd: observation["JD?"] ? observation.JD : undefined,
            siderealTime: observation["ST?"] ? observation.ST : undefined,
            hourAngle: observation["HA?"] ? observation.HA : undefined,
            airmass: observation["AIRMASS?"] ? observation.AIRMASS : undefined,
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
