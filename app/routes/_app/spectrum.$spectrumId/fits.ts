import { createFileRoute } from "@tanstack/react-router"
import sharp from "sharp"
import { db } from "~/db"
import { observationToFITSFilename, spectrumCropToFITS } from "~/lib/fits"
import { readUploadedFile } from "~/lib/uploads"

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
                  with: { image: true, observatory: true, project: true },
                },
              },
            },
          },
        })
        if (!spectrum) return new Response("Not found", { status: 404 })

        const { observation } = spectrum
        const { plate } = observation
        const left = observation.imageLeft + spectrum.imageLeft
        const top = observation.imageTop + spectrum.imageTop

        let image = await readUploadedFile(plate.image.id)
        image = await sharp(image)
          .rotate(plate.imageRotation)
          .extract({
            left,
            top,
            width: spectrum.imageWidth,
            height: spectrum.imageHeight,
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
        const fileName = observationToFITSFilename(
          plate["PLATE-N"],
          observation.OBJECT,
          `${spectrum.type}.crop`,
        )

        const fits = spectrumCropToFITS(pixels, {
          width: spectrum.imageWidth,
          height: spectrum.imageHeight,
          metadata: {
            fileName,
            origin: plate.project.name,
            plateNumber: plate["PLATE-N"],
            observatory: plate.observatory.name,
            observatoryTimezone: plate.observatory.timezone,
            telescope: plate["TELESCOPE?"] ? plate.TELESCOPE : undefined,
            observerNotes: plate["OBSNOTES?"] ? plate.OBSNOTES : undefined,
            notes: plate["NOTES?"] ? plate.NOTES : undefined,
            scanner: plate["SCANNER?"] ? plate.SCANNER : undefined,
            scanResolution: plate["SCANRES?"] ? plate.SCANRES : undefined,
            pixelSize: plate["PIXSIZE?"] ? plate.PIXSIZE : undefined,
            scanGain: plate["SCANGAIN?"] ? plate.SCANGAIN : undefined,
            scanSoftware: plate["SCANSOFT?"] ? plate.SCANSOFT : undefined,
            dateScan: plate["DATESCAN?"] ? plate.DATESCAN : undefined,
            scanAuthor: plate["SCANAUTH?"] ? plate.SCANAUTH : undefined,
            observer: plate["OBSERVER?"] ? plate.OBSERVER : undefined,
            instrument: plate["INSTRUMENT?"] ? plate.INSTRUMENT : undefined,
            object: observation["OBJECT?"] ? observation.OBJECT : undefined,
            dateObs: observation["DATE-OBS?"] ? observation["DATE-OBS"] : undefined,
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
