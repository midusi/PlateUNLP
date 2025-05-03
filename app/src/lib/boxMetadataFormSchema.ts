import { z } from "zod"

export const boxMetadataFormSchema = z.object({
    OBJECT: z.string().nonempty(),
    DATE_OBS: z.date(),
    MAIN_ID: z.string().nonempty(),
    UT: z.number(),
})
