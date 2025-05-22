import { z } from "zod"

export const boxMetadataFormSchema = z.object({
    OBJECT: z.string().nonempty().nullable(),
    DATE_OBS: z.date().nullable(),
    UT: z.number().nullable(),
})
