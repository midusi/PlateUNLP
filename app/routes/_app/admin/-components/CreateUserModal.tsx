import { useQueryClient } from "@tanstack/react-query"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import { notifyError, notifySucces } from "~/lib/notifications"
import { CreateUserSchema } from "~/types/auth"
import { createUser } from "../-actions/create-user"

export function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()

  const form = useAppForm({
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      role: "user" as "admin" | "user",
    },
    validators: { onChange: CreateUserSchema },
    onSubmit: async ({ value }) => {
      try {
        await createUser({ data: value })
        notifySucces("User created")
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
        onClose()
      } catch (error) {
        notifyError("Failed to create user", error)
      }
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-120 p-4">
        <CardHeader>
          <h2 className="font-bold text-olive-950 text-xl">Create User</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
          <form.AppField name="username">
            {(field) => <field.TextField label="Username" />}
          </form.AppField>
          <form.AppField name="email">{(field) => <field.TextField label="Email" />}</form.AppField>
          <form.AppField name="password">
            {(field) => <field.PasswordField label="Password" />}
          </form.AppField>
          <form.AppField name="role">
            {(field) => (
              <field.SelectFieldSimple
                label="Role"
                options={[
                  { label: "User", value: "user" },
                  { label: "Admin", value: "admin" },
                ]}
              />
            )}
          </form.AppField>
        </CardContent>
        <CardFooter className="flex justify-between">
          <form.Subscribe selector={(formState) => [formState.isValid, formState.isSubmitting]}>
            {([isValid, isSubmitting]) => (
              <>
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button onClick={form.handleSubmit} disabled={!isValid}>
                  {isSubmitting ? (
                    <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                  ) : (
                    <span>Create</span>
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
