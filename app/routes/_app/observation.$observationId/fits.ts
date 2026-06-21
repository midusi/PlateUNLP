import { createFileRoute } from "@tanstack/react-router"
import sharp from "sharp"
import { db } from "~/db"
import { observationToFITSFilename, spectrumCropToFITS, unknownable } from "~/lib/fits"
import { log } from "~/lib/log"
import { readUploadedFile } from "~/lib/uploads"

export const Route = createFileRoute("/_app/observation/$observationId/fits")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        log().set({
          fitsExport: { kind: "observation-image", observationId: params.observationId },
        })
        const observation = await db.query.observation.findFirst({
          where: (t, { eq }) => eq(t.id, params.observationId),
          with: {
            plate: {
              with: { image: true, observatory: true, project: true },
            },
          },
        })
        if (!observation) {
          log().warn("FITS export: observation not found")
          return new Response("Not found", { status: 404 })
        }

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
            telescope: unknownable(plate.TELESCOPE, plate["TELESCOPE?"]),
            observerNotes: unknownable(plate.OBSNOTES, plate["OBSNOTES?"]),
            plateNotes: unknownable(plate.PLATNOTE, plate["PLATNOTE?"]),
            scanner: unknownable(plate.SCANNER, plate["SCANNER?"]),
            scanResolution: unknownable(plate.SCANRES, plate["SCANRES?"]),
            scanGain: unknownable(plate.SCANGAIN, plate["SCANGAIN?"]),
            scanSoftware: unknownable(plate.SCANSOFT, plate["SCANSOFT?"]),
            dateScan: unknownable(plate.DATESCAN, plate["DATESCAN?"]),
            scanAuthor: unknownable(plate.SCANAUTH, plate["SCANAUTH?"]),
            scannerNotes: unknownable(plate.SCANNOTE, plate["SCANNOTE?"]),
            observer: unknownable(plate.OBSERVER, plate["OBSERVER?"]),
            instrument: unknownable(plate.INSTRUME, plate["INSTRUME?"]),
            detector: unknownable(plate.DETECTOR, plate["DETECTOR?"]),
            obsN: observation["OBS-N"] || undefined,
            objectNotes: unknownable(observation.OBJNOTES, observation["OBJNOTES?"]),
            object: unknownable(observation.OBJECT, observation["OBJECT?"]),
            dateObs: unknownable(observation["DATE-OBS"], observation["DATE-OBS?"]),
            dateOrg: unknownable(observation["DATE-ORG"], observation["DATE-ORG?"]),
            exptime: unknownable(observation.EXPTIME, observation["EXPTIME?"]),
            imageType: unknownable(observation.IMAGETYP, observation["IMAGETYP?"]),
            mainId: unknownable(observation["MAIN-ID"], observation["MAIN-ID?"]),
            spectralType: unknownable(observation.SPTYPE, observation["SPTYPE?"]),
            ra: unknownable(observation.RA, observation["RA?"]),
            dec: unknownable(observation.DEC, observation["DEC?"]),
            epoch: unknownable(observation.EQUINOX, observation["EQUINOX?"]),
            equinox: unknownable(observation.EQUINOX, observation["EQUINOX?"]),
            ra2000: unknownable(observation.RA2000, observation["RA2000?"]),
            dec2000: unknownable(observation.DEC2000, observation["DEC2000?"]),
            ra1950: unknownable(observation.RA1950, observation["RA1950?"]),
            dec1950: unknownable(observation.DEC1950, observation["DEC1950?"]),
            jd: unknownable(observation.JD, observation["JD?"]),
            siderealTime: unknownable(observation.ST, observation["ST?"]),
            hourAngle: unknownable(observation.HA, observation["HA?"]),
            airmass: unknownable(observation.AIRMASS, observation["AIRMASS?"]),
          },
        })

        log().set({
          fitsExport: {
            kind: "observation-image",
            observationId: params.observationId,
            plateId: plate.id,
            width: observation.imageWidth,
            height: observation.imageHeight,
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
