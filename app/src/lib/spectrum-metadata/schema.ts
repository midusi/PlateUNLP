import { z } from "zod/v4"

export const getSpectrumMetadataInputSchema = z.object({
  OBSERVAT: z.string().nonempty(),
  OBJECT: z.string().nonempty(),
  "DATE-OBS": z.string().nonempty(),
  UT: z.string().nonempty(),
})

export type GetSpectrumMetadataInput = z.infer<
  typeof getSpectrumMetadataInputSchema
>

export const spectrumMetadataSchema = z.object({
  OBJECT: z.string().nonempty(),
  "DATE-OBS": z.iso.date(),
  UT: z.iso.time({ precision: 0 }),
  "TIME-OBS": z.iso.time().optional(),
  MAIN_ID: z.string().nonempty(),
  ST: z.union([z.undefined(), z.number()]),
  HA: z.union([z.undefined(), z.number()]),
  RA: z.union([z.undefined(), z.number()]),
  DEC: z.union([z.undefined(), z.number()]),
  GAIN: z.union([z.undefined(), z.number()]),
  RA2000: z.union([z.undefined(), z.number()]),
  DEC2000: z.union([z.undefined(), z.number()]),
  RA1950: z.union([z.undefined(), z.number()]),
  DEC1950: z.union([z.undefined(), z.number()]),
  EXPTIME: z.number().optional(),
  DETECTOR: z.string().optional(),
  IMAGETYP: z.string().optional(),
  SPTYPE: z.string().optional(),
  JD: z.union([z.undefined(), z.number()]),
  EQUINOX: z.union([z.undefined(), z.number()]),
  AIRMASS: z.union([z.undefined(), z.number()]),
})
