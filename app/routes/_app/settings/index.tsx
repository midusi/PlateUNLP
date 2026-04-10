import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import type z from "zod"
import defaultUserImage from "~/assets/avatar.png"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { Field, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useAppForm } from "~/hooks/use-app-form"
import { authClient } from "~/lib/auth-client"
import { getSession } from "../-actions/get-session"
import { breadcrumb } from "~/lib/breadcrumbs"
import { notifyError } from "~/lib/notifications"
import { BasicUserFieldsSchema } from "~/types/auth"
import { ChangePasswordModal } from "./-components/ChangePasswordModal"

export const Route = createFileRoute("/_app/settings/")({
  component: RouteComponent,
  loader: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: "/login" })
    }
    return {
      breadcrumbs: [
        breadcrumb({
          title: "Account settings",
          to: "/settings",
        }),
      ],
      user: session.user,
    }
  },
})

function RouteComponent() {
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false)
  const { user } = Route.useLoaderData()

  const defaultValues: z.output<typeof BasicUserFieldsSchema> = {
    email: user.email,
    name: user.name,
    image: user.image || null,
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: BasicUserFieldsSchema },
    onSubmit: async ({ value }) => {
      try {
        const name = value.name
        const image = value.image || defaultUserImage
        if (name !== user.name) {
          await authClient.updateUser({
            name,
          })
        }
        if (image !== user.image) {
          await authClient.updateUser({ image })
        }
        //session.refetch()
      } catch (error) {
        notifyError("Failed to update user information", error)
      }
    },
  })

  return (
    <div className="mt-10 flex h-full w-full items-center justify-center">
      <Card className="w-[400px] overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit(e)
          }}
        >
          <CardHeader className="m-4 flex flex-col items-center justify-center">
            <h1 className="text-2xl">Your Profile</h1>
            <p className="text-gray-600 text-sm">Manage your profile information</p>
          </CardHeader>
          <CardContent className="m-4 flex flex-col gap-4">
            <form.AppField name="name">
              {(field) => <field.SettingsField label="Username" />}
            </form.AppField>
            <form.AppField name="image">
              {(field) => (
                <field.ImageField
                  label="Imagen"
                  value={field.state.value}
                  maxHeight={512}
                  maxWidth={512}
                />
              )}
            </form.AppField>
            <form.AppField name="email">
              {(field) => (
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input name={field.name} value={field.state.value} disabled />
                </Field>
              )}
            </form.AppField>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Button
                type="button"
                className="w-full border bg-gray-300 hover:bg-gray-400"
                onClick={() => setChangePasswordOpen(true)}
              >
                Change Password
              </Button>
            </Field>
            {isChangePasswordOpen && (
              <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />
            )}
          </CardContent>
          <CardFooter className="flex flex-col justify-center pt-4">
            <form.Subscribe
              selector={(formState) => [
                formState.isValid,
                formState.isSubmitting,
                formState.isDirty,
              ]}
            >
              {([isValid, isSubmitting, isDirty]) => (
                <Button type="submit" disabled={!isValid || !isDirty} className="w-48 border">
                  {isSubmitting ? (
                    <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
