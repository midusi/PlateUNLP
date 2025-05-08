import { z } from "zod"

export const boxMetadataFormSchema = z.object({
    OBJECT: z.string().nonempty(),
    DATE_OBS: z.date(),
    UT: z.number(),
})
