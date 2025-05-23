import process from "node:process"
import { z } from "zod/v4"

export const env = z
  .object({
    DATABASE_URL: z.string().nonempty(),
    DATABASE_TOKEN: z.string().optional(),
  })
  .parse(process.env)
