import z from "zod"

/**
 * This schema defines the fields for log in form.
 */
export const LogInFieldsSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string(),
})

/**
 * This schema defines the fields for change userinfo form.
 */
export const BasicUserFieldsSchema = z.object({
  email: z.email("Invalid email address"),
  name: z.string(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters"),
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

/**
 * This schema defines the fields for creating a user (admin panel).
 */
export const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "user"]),
})
