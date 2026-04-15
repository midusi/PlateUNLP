import { useState } from "react"
import { Button } from "~/components/ui/button"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Input } from "~/components/ui/input"
import { notifyError, notifySucces } from "~/lib/notifications"
import { resetPassword } from "../-actions/reset-password"

export function ResetPasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isResetting, setIsResetting] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)

  const handleReset = async () => {
    try {
      setIsResetting(true)
      const result = await resetPassword({ data: { userId } })
      setNewPassword(result.newPassword)
      notifySucces("Password reset successfully")
    } catch (error) {
      notifyError("Failed to reset password", error)
    } finally {
      setIsResetting(false)
    }
  }

  const handleCopy = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword)
      notifySucces("Password copied to clipboard")
    }
  }

  const handleClose = () => {
    setNewPassword(null)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset Password</AlertDialogTitle>
          {!newPassword ? (
            <AlertDialogDescription>
              Reset the password for <strong>{userName}</strong>? A new random password will be generated.
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription>
              New password for <strong>{userName}</strong>. Copy it now — it won't be shown again.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {newPassword && (
          <div className="flex items-center gap-2">
            <Input value={newPassword} readOnly className="font-mono" />
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <span className="icon-[ph--copy-bold] size-4" />
            </Button>
          </div>
        )}

        <AlertDialogFooter>
          {!newPassword ? (
            <>
              <AlertDialogClose>Cancel</AlertDialogClose>
              <Button onClick={handleReset} disabled={isResetting}>
                {isResetting ? (
                  <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                ) : (
                  <span>Reset Password</span>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
