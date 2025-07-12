import { z } from "zod"

export const boxMetadataFormSchema = z.object({
  OBJECT: z.string().nonempty().nullish(),
  DATE_OBS: z.date().nullish(),
  UT: z.number().nullish(),
})

export type FormData = z.infer<typeof boxMetadataFormSchema>
