import z from "zod";

/**
 * This schema defines the fields for log in form.
 */
export const LogInFieldsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})