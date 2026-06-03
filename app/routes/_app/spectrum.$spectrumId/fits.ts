import { createFileRoute } from "@tanstack/react-router"
import { db } from "~/db"
import { extractedSpectrumToFITS, observationToFITSFilename, unknownable } from "~/lib/fits"

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
        const fileName = observationToFITSFilename(
          plate["PLATE-N"],
          observation.OBJECT,
          `${spectrum.type}.extracted`,
        )

        const fits = extractedSpectrumToFITS(spectrum.intensityArr, {
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
