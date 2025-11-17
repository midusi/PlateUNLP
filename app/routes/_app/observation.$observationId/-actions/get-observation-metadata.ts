import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { db } from "~/db"
import type { ObservationMetadataSchema } from "~/types/spectrum-metadata"

export const getObservationMetadata = createServerFn()
  .inputValidator(z.object({ observationId: z.string() }))
  .handler(
    async ({ data }): Promise<z.infer<typeof ObservationMetadataSchema> & { OBSERVAT: string }> => {
      const observation = await db.query.observation.findFirst({
        where: (observation, { eq }) => eq(observation.id, data.observationId),
        with: { plate: true },
      })
      if (!observation) {
        throw new Error(`Observation with ID ${data.observationId} not found`)
      }
      return {
        OBSERVAT: observation.plate.OBSERVAT,
        OBJECT: observation.OBJECT,
        "DATE-OBS": { value: observation["DATE-OBS"], isKnown: observation["DATE-OBS?"] },
        UT: { value: observation.UT, isKnown: observation["UT?"] },
        "MAIN-ID": { value: observation["MAIN-ID"], isKnown: observation["MAIN-ID?"] },
        SPTYPE: { value: observation.SPTYPE, isKnown: observation["SPTYPE?"] },
        RA: { value: observation.RA, isKnown: observation["RA?"] },
        DEC: { value: observation.DEC, isKnown: observation["DEC?"] },
        EQUINOX: { value: observation.EQUINOX, isKnown: observation["EQUINOX?"] },
        RA2000: { value: observation.RA2000, isKnown: observation["RA2000?"] },
        DEC2000: { value: observation.DEC2000, isKnown: observation["DEC2000?"] },
        RA1950: { value: observation.RA1950, isKnown: observation["RA1950?"] },
        DEC1950: { value: observation.DEC1950, isKnown: observation["DEC1950?"] },
        "TIME-OBS": { value: observation["TIME-OBS"], isKnown: observation["TIME-OBS?"] },
        JD: { value: observation.JD, isKnown: observation["JD?"] },
        ST: { value: observation.ST, isKnown: observation["ST?"] },
        HA: { value: observation.HA, isKnown: observation["HA?"] },
        AIRMASS: { value: observation.AIRMASS, isKnown: observation["AIRMASS?"] },
        GAIN: { value: observation.GAIN, isKnown: observation["GAIN?"] },
        EXPTIME: { value: observation.EXPTIME, isKnown: observation["EXPTIME?"] },
        DETECTOR: { value: observation.DETECTOR, isKnown: observation["DETECTOR?"] },
        IMAGETYP: { value: observation.IMAGETYP, isKnown: observation["IMAGETYP?"] },
      }
    },
  )

export const getObservationMetadataQueryOptions = (observationId: string) =>
  queryOptions({
    queryKey: ["observation", "metadata", observationId],
    queryFn: () => getObservationMetadata({ data: { observationId } }),
  })
