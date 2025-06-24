import { z } from "zod/v4"


export const plateMetadataFormSchema = z.object({
  OBSERVAT: z.string().nonempty("This field is required"),
  PLATE_N: z.string().nonempty("This field is required"),
  OBSERVER: z.string().optional(),
  DIGITALI: z.string().optional(),
  SCANNER: z.string().optional(),
  SOFTWARE: z.string().optional(),
  TELESCOPE: z.string().optional(),
  DETECTOR: z.string().optional(),
  INSTRUMENT: z.string().optional(),
})