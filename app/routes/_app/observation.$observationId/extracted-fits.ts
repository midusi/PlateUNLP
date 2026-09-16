import { createFileRoute } from "@tanstack/react-router"
import JSZip from "jszip"
import sharp from "sharp"
import { db } from "~/db"
import { observationToFITSFilename, spectrumCropToFITS, unknownable } from "~/lib/fits"
import { flipVerticalUint16 } from "~/lib/fits/utils"
import { readEditedFile } from "~/lib/uploads"

function safeFilename(s: string) {
  return s.replace(/[^a-zA-Z0-9._-]/g, "_")
}

// Ruta que devuelve un .zip de archivos FITS para cada observación.
export const Route = createFileRoute("/_app/observation/$observationId/extracted-fits")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // Obtener cada espectro y lampara de comparación de la observación.
        const observation = await db.query.observation.findFirst({
          where: (t, { eq }) => eq(t.id, params.observationId),
          with: {
            plate: {
              with: { image: true, observatory: true, project: true },
            },
            spectra: true,
          },
        })
        if (!observation) return new Response("Not found", { status: 404 })
        if (observation.spectra.length === 0) {
          return new Response("No spectra found", { status: 400 })
        }

        // Para cada espectro, generar un archivo FITS
        const orderedSpectra = [...observation.spectra].sort(
          (a, b) => a.imageTop - b.imageTop || a.imageLeft - b.imageLeft,
        )
        const maxLength = Math.max(
          ...orderedSpectra.map((spectrum) => spectrum.intensityArr.length),
        )
        if (maxLength === 0) {
          return new Response("No extracted spectra found", { status: 400 })
        }

        // Para cada observación el archivo debe llamarce [plate][obs.label][spectrum.type][|1|2].fits
        const { plate } = observation
        const baseFileName = observationToFITSFilename(
          plate["PLATE-N"],
          observation["OBS-N"],
          "observation.extracted",
          false,
        )
        const zip = new JSZip()

        // Cargar la imagen editada de la placa una sola vez y usarla para extraer
        const plateImageBuffer = await readEditedFile(plate)
        const plateSharp = sharp(plateImageBuffer)



        // Para cada espectro generamos un FITS individual y lo añadimos al zip
        for (let i = 0; i < orderedSpectra.length; i++) {
          const spectrum = orderedSpectra[i]
          const spectrumLabel = spectrum.type ?? `spec-${spectrum.id ?? i + 1}`
          const perName = safeFilename(`${baseFileName}-${i + 1}-${spectrumLabel}.fits`)
          const o = observation
          const left = o.imageLeft + (spectrum.imageLeft ?? 0)
          const top = o.imageTop + (spectrum.imageTop ?? 0)
          const width = spectrum.imageWidth ?? 0
          const height = spectrum.imageHeight ?? 0

          console.log(`Extracting spectrum ${spectrum.id} at ${left},${top} size ${width}x${height}`)

          if (width > 0 && height > 0) {
            // clonar la instancia sharp y extraer la región
            // preview kept in memory for extraction, no debug file written

            const regionBuf = await plateSharp
              .clone()
              .extract({ left, top, width, height })
              .toColorspace("b-w")
              .extractChannel(0)
              .raw({ depth: "ushort" })
              .toBuffer()

            const pixels = new Uint16Array(
              regionBuf.buffer,
              regionBuf.byteOffset,
              regionBuf.byteLength / Uint16Array.BYTES_PER_ELEMENT,
            )
              const flipped = flipVerticalUint16(pixels, width, height)

              const fits = spectrumCropToFITS(flipped, {
              width,
              height,
              metadata: {
                fileName: perName,
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

            zip.file(perName, fits.toBuffer())
          } else {
            console.warn(`Spectrum ${spectrum.id} missing dimensions; skipping.`)
          }
        }

        // Generar un .zip
        const zipName = safeFilename(`${baseFileName.replace(/\.fits$/i, "")}.zip`)
        const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" })

        // Devolver el .zip
        return new Response(content, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${zipName}"`,
            "Cache-Control": "no-store",
          },
        })
      },
    },
  }
})
