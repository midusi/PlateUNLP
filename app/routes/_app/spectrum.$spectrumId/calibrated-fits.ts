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
                plate: true,
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

        const fits = calibratedSpectrumToFITS(spectrum.intensityArr, {
          plateNumber: observation.plate["PLATE-N"],
          observatory: observation.plate.OBSERVAT,
          observer: observation.plate["OBSERVER?"] ? observation.plate.OBSERVER : undefined,
          instrument: observation.plate["INSTRUME?"] ? observation.plate.INSTRUME : undefined,
          detector: observation.plate["DETECTOR?"] ? observation.plate.DETECTOR : undefined,
          object: observation["OBJECT?"] ? observation.OBJECT : undefined,
          dateObs: observation["DATE-OBS?"] ? observation["DATE-OBS"] : undefined,
          exptime: observation["EXPTIME?"] ? observation.EXPTIME : undefined,
          imageType: observation["IMAGETYP?"] ? observation.IMAGETYP : undefined,
          mainId: observation["MAIN-ID?"] ? observation["MAIN-ID"] : undefined,
          spectralType: observation["SPTYPE?"] ? observation.SPTYPE : undefined,
          calibrationMaterial: calibration.material,
          calibrationFunction: calibration.inferenceFunction,
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
            "Content-Disposition": `attachment; filename="${observationToFITSFilename(observation.plate["PLATE-N"], observation.OBJECT, `${spectrum.type}.calibrated`)}"`,
            "Cache-Control": "no-store",
          },
        })
      },
    },
  },
})
