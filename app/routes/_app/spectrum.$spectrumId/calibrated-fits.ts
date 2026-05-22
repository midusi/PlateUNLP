import { createFileRoute } from "@tanstack/react-router"
import { db } from "~/db"
import { calibratedSpectrumToFITS, observationToFITSFilename } from "~/lib/fits"
import { legendreAlgoritm, linearRegression, piecewiseLinearRegression } from "~/lib/utils"

export const Route = createFileRoute("/_app/spectrum/$spectrumId/calibrated-fits")({
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
                calibration: true,
              },
            },
          },
        })
        if (!spectrum) return new Response("Not found", { status: 404 })

        const { observation } = spectrum
        const calibration = observation.calibration
        if (!calibration) {
          return new Response("Calibration not found", { status: 404 })
        }

        const matches = []
        const smallArr =
          calibration.lampPoints.length >= calibration.materialPoints.length
            ? calibration.materialPoints
            : calibration.lampPoints
        for (let i = 0; i < smallArr.length; i++) {
          matches.push({
            lamp: calibration.lampPoints[i],
            material: calibration.materialPoints[i],
          })
        }
        if (matches.length === 0) {
          return new Response("Calibration points not found", { status: 400 })
        }

        const x = matches.map((match) => match.lamp.x)
        const y = matches.map((match) => match.material.x)
        let calibrate: (value: number) => number
        try {
          calibrate =
            calibration.inferenceFunction === "Linear regresion"
              ? linearRegression(x, y)
              : calibration.inferenceFunction === "Piece wise linear regression"
                ? piecewiseLinearRegression(x, y)
                : legendreAlgoritm(x, y, calibration.deegre)
        } catch (error) {
          return new Response(error instanceof Error ? error.message : "Invalid calibration", {
            status: 400,
          })
        }

        const lastPixel = Math.max(0, spectrum.intensityArr.length - 1)
        const wavelengthStart = calibrate(0)
        const wavelengthEnd = calibrate(lastPixel)
        const wavelengthStep =
          spectrum.intensityArr.length > 1
            ? (wavelengthEnd - wavelengthStart) / (spectrum.intensityArr.length - 1)
            : 0

        const plate = observation.plate
        const fileName = observationToFITSFilename(
          plate["PLATE-N"],
          observation.OBJECT,
          `${spectrum.type}.calibrated`,
        )

        const fits = calibratedSpectrumToFITS(spectrum.intensityArr, {
          fileName,
          origin: plate.project.name,
          plateNumber: plate["PLATE-N"],
          observatory: plate.OBSERVAT,
          observatoryTimezone: plate.observatory.timezone,
          telescope: plate["TELESCOPE?"] ? plate.TELESCOPE : undefined,
          instrument: plate["INSTRUME?"] ? plate.INSTRUME : undefined,
          detector: plate["DETECTOR?"] ? plate.DETECTOR : undefined,
          observer: plate["OBSERVER?"] ? plate.OBSERVER : undefined,
          observerNotes: plate["OBSNOTES?"] ? plate.OBSNOTES : undefined,
          plateNotes: plate["PLATNOTE?"] ? plate.PLATNOTE : undefined,
          scanner: plate["SCANNER?"] ? plate.SCANNER : undefined,
          scanResolution: plate["SCANRES?"] ? plate.SCANRES : undefined,
          scanGain: plate["SCANGAIN?"] ? plate.SCANGAIN : undefined,
          scanSoftware: plate["SCANSOFT?"] ? plate.SCANSOFT : undefined,
          dateScan: plate["DATESCAN?"] ? plate.DATESCAN : undefined,
          scanAuthor: plate["SCANAUTH?"] ? plate.SCANAUTH : undefined,
          scannerNotes: plate["SCANNOTE?"] ? plate.SCANNOTE : undefined,
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
          calibrationMaterial: calibration.material,
          calibrationFunction: calibration.inferenceFunction,
          calibrationNotes: calibration["CALNOTES?"] ? calibration.CALNOTES : undefined,
          wavelengthStart,
          wavelengthStep,
          wavelengthUnit: "Angstrom",
        })

        if (calibration.inferenceFunction !== "Linear regresion") {
          fits.header.appendHistory(
            "Non-linear calibration was linearized for CRVAL1/CDELT1 export",
          )
        }

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
