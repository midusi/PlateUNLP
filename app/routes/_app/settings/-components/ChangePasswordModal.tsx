import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import { authClient } from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import { ChangePasswordSchema } from "~/types/auth"

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const form = useAppForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: { onChange: ChangePasswordSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const { currentPassword, newPassword } = value
        const { error } = await authClient.changePassword({
          newPassword,
          currentPassword,
          revokeOtherSessions: true,
        })
        if (error) {
          notifyError("Failed to change password", error.message)
          return
        }
        formApi.reset(value)
        onClose() // cerramos el modal
      } catch (error) {
        notifyError("Failed to change password", error)
      }
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-[400px] p-4">
        <CardHeader>
          <h2 className="text-xl">Change Password</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form.AppField name="currentPassword">
            {(field) => <field.PasswordField label="Current Password" />}
          </form.AppField>
          <form.AppField name="newPassword">
            {(field) => <field.PasswordField label="New Password" />}
          </form.AppField>
          <form.AppField name="confirmPassword">
            {(field) => <field.PasswordField label="Confirm Password" />}
          </form.AppField>
        </CardContent>
        <CardFooter className="flex justify-between">
          <form.Subscribe
            selector={(formState) => [formState.isValid, formState.isSubmitting, formState.isDirty]}
          >
            {([isValid, isSubmitting, _isDirty]) => (
              <>
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button onClick={form.handleSubmit} disabled={!isValid}>
                  {isSubmitting ? (
                    <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              </>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
    </div>
  )
}
