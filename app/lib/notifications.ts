import { toast } from "sonner"

/**
 * Notify an error with a title and description.
 * @param title The title of the error notification, like "Error logging in".
 * @param error The error object or message to display in the notification, like "Invalid credentials" or an Error object.
 */
export function notifyError(title: string, error?: unknown) {
  if (error) console.error(error)
  toast.error(title, {
    description: !error ? undefined : error instanceof Error ? error.message : String(error),
    duration: 10000,
  })
}
