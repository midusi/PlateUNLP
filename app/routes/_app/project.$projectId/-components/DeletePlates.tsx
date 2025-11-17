import { useRouter } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { notifyError } from "~/lib/notifications"
import { deletePlates } from "../-actions/delete-plates"

export function DeletePlates({
  plateIds,
  onDeleted,
}: {
  plateIds: string[]
  onDeleted?: () => void
}) {
  const router = useRouter()
  const [alertOpen, setAlertOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await deletePlates({ data: { plateIds } })
      setAlertOpen(false)
    } catch (error) {
      notifyError("Failed to delete plates", error)
    } finally {
      onDeleted?.()
      router.invalidate()
      setIsSubmitting(false)
    }
  }, [router, plateIds, onDeleted])

  return (
    <AlertDialog
      open={alertOpen}
      onOpenChange={(open) => {
        if (!isSubmitting) setAlertOpen(open)
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        <span className="icon-[ph--trash-bold]" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete <strong>{plateIds.length} plate(s)</strong>. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose disabled={isSubmitting}>Cancel</AlertDialogClose>
          <Button variant="destructive" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? (
              <>
                <span className="icon-[ph--spinner-bold] animate-spin" />
                Deleting
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
