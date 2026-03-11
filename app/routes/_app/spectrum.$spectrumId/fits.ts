import { createFileRoute } from "@tanstack/react-router"
import { db } from "~/db"
import { extractedSpectrumToFITS, observationToFITSFilename } from "~/lib/fits"

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
          telescope: plate["TELESCOPE?"] ? plate.TELESCOPE : undefined,
          observerNotes: plate["OBSNOTES?"] ? plate.OBSNOTES : undefined,
          notes: plate["NOTES?"] ? plate.NOTES : undefined,
          scanner: plate["SCANNER?"] ? plate.SCANNER : undefined,
          scanResolution: plate["SCANRES?"] ? plate.SCANRES : undefined,
          scanGain: plate["SCANGAIN?"] ? plate.SCANGAIN : undefined,
          scanSoftware: plate["SCANSOFT?"] ? plate.SCANSOFT : undefined,
          dateScan: plate["DATESCAN?"] ? plate.DATESCAN : undefined,
          scanAuthor: plate["SCANAUTH?"] ? plate.SCANAUTH : undefined,
          observer: plate["OBSERVER?"] ? plate.OBSERVER : undefined,
          instrument: plate["INSTRUME?"] ? plate.INSTRUME : undefined,
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
