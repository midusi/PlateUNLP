import { z } from "zod/v4"

export const plateMetadataFormSchema = z.object({
  OBSERVAT: z.string().nonempty(),
  OBSERVER: z.string().optional(),
  DIGITALI: z.string().optional(),
  SCANNER: z.string().optional(),
  SOFTWARE: z.string().optional(),
  PLATE_N: z.string().nonempty(),
  TELESCOPE: z.string().optional(),
  DETECTOR: z.string().optional(),
  INSTRUMENT: z.string().optional(),
})
