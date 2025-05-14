import { z } from "zod"

export const loginFormSchema = z.object({
    Email: z.string().nonempty("Email is required")
        .email(),
    Password: z.string().nonempty("Password is required")
        .min(6, "Password must be at least 6 characters long")
})
