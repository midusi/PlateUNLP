import { createFileRoute } from "@tanstack/react-router"
import { db } from "~/db"
import { calibratedSpectrumToFITS, observationToFITSFilename, unknownable } from "~/lib/fits"
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
          calibrationMaterial: calibration.material,
          calibrationFunction: calibration.inferenceFunction,
          calibrationNotes: unknownable(calibration.CALNOTES, calibration["CALNOTES?"]),
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
