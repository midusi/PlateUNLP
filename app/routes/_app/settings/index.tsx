import { createFileRoute, useLoaderData } from "@tanstack/react-router"
import { useState } from "react"
import type z from "zod"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { Field, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useAppForm } from "~/hooks/use-app-form"
import { authClient } from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import type { Breadcrumbs } from "~/routes/_app/-components/AppBreadcrumbs"
import { BasicUserFieldsSchema, LogUpFieldsSchema } from "~/types/auth"
import { ChangePasswordModal } from "./-components/ChangePasswordModal"

export const Route = createFileRoute("/_app/settings/")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const session = await authClient.getSession()
    return {
      breadcrumbs: [
        { title: "Home", link: { to: "/projects" } },
        {
          title: "Account settings",
          link: { to: "/settings" },
        },
      ] satisfies Breadcrumbs,
      session: session,
    }
  },
})

function RouteComponent() {
  const [isChangePasswordOpen, setChangePasswordOpen] = useState(false)
  const { session } = Route.useLoaderData()

  const defaultValues: z.output<typeof BasicUserFieldsSchema> = {
    email: session.data?.user.email!,
    name: session.data?.user.name!,
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: BasicUserFieldsSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const email = value.email
        const name = value.name
        if (name !== session.data?.user.name) {
          await authClient.updateUser({
            name,
          })
        }
        formApi.reset(value)
        //session.refetch()
      } catch (error) {
        notifyError("Failed to update user information", error)
      }
    },
  })

  return (
    <div className="mt-10 flex h-full w-full max-w-6xl items-center justify-center">
      <Card className="w-[400px] overflow-hidden">
        <CardHeader className="m-4 flex flex-col items-center justify-center">
          <h1 className="text-2xl">Your Profile</h1>
          <p className="text-gray-600 text-sm">Manage your profile information</p>
        </CardHeader>
        <CardContent className="m-4 flex flex-col gap-4">
          <form.AppField name="email">
            {(field) => (
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input name={field.name} value={field.state.value} disabled />
              </Field>
            )}
          </form.AppField>
          <form.AppField name="name">
            {(field) => <field.SettingsField label="Username" />}
          </form.AppField>
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Button
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
        <CardFooter className="m-4 flex flex-col justify-center">
          {/* <Button onClick={()=>logUp("santiagoandresponteahon@hotmail.com", "12345678", "santiago")}>Registrar Usuario</Button> */}
          <form.Subscribe
            selector={(formState) => [formState.isValid, formState.isSubmitting, formState.isDirty]}
          >
            {([isValid, isSubmitting, isDirty]) => (
              <Button
                //logIn("santiagoandresponteahon@hotmail.com", "12345678")
                disabled={!isValid}
                className="w-full border"
                onClick={form.handleSubmit}
              >
                {isSubmitting ? (
                  <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                ) : (
                  <span>Save Changes</span>
                )}
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
    </div>
  )
}
