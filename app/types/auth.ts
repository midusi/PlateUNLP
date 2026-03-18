import z from "zod"

/**
 * This schema defines the fields for log in form.
 */
export const LogInFieldsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
})

/**
 * This schema defines the fields for log up form.
 */
export const LogUpFieldsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string(),
  image: z.string().nullable(),
})

/**
 * This schema defines the fields for change userinfo form.
 */
export const BasicUserFieldsSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string(),
  image: z.string().nullable(),
})

/**
 * This schema defines the fields for change password form.
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(8, "Minimum 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
