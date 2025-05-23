import { z } from "zod/v4"

export const loginFormSchema = z.object({
    Email: z.email(),
    Password: z.string().min(6, "Password must be at least 6 characters long"),
})
