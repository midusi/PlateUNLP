import { z } from "zod"

export const spectrumMetadataFormSchema = z.object({
    OBJECT: z.string().nonempty(),
    DATE_OBS: z.date(),
    TIME_OBS: z.number().optional(),
    MAIN_ID: z.string().nonempty(),
    UT: z.number(),
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
    AIRMASS: z.union([z.undefined(), z.number()])
})
