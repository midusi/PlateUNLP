import { Toast } from "@base-ui-components/react/toast"

export const toastManager = Toast.createToastManager()

type ToastType = "default" | "success" | "error" | "warning" | "info"

/**
 * Notify an error with a title and description.
 * @param title The title of the error notification, like "Error logging in".
 * @param error The error object or message to display in the notification, like "Invalid credentials" or an Error object.
 */
export function notifyError(title: string, error?: unknown) {
  if (error) console.error(error)
  toastManager.add({
    title,
    description: error instanceof Error ? error.message : String(error),
    timeout: 10000,
    type: "error" satisfies ToastType,
  })
}
