import { z } from "zod"

export const plateMetadataFormSchema = z.object({
  OBSERVAT: z.string().nonempty("This field is required"),
  PLATE_N: z.string().nonempty("This field is required"),
  TELESCOPE: z.string().optional(),
  INSTRUMENT: z.string().optional(),
  OBSERVER: z.string().optional(),
  OBSNOTES: z.string().optional(),
  NOTES: z.string().optional(),
  SCANNER: z.string().optional(),
  SCANRES: z.string().optional(),
  PIXSIZE: z.string().optional(),
  SCANGAIN: z.string().optional(),
  SCANSOFT: z.string().optional(),
  DATESCAN: z.string().optional(),
  SCANAUTH: z.string().optional(),
})
