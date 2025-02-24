import { z } from "zod"

export const plateMetadataFormSchema = z.object({
    OBSERVAT: z.string().nonempty(),
    OBSERVER: z.string().optional(),
    DIGITALI: z.number().optional(),
    SCANNER: z.string().optional(),
    SOFTWARE: z.string().optional(),
    PLATE_N: z.string().nonempty()
})
