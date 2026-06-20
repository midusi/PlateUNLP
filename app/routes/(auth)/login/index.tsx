import { createFileRoute, useNavigate } from "@tanstack/react-router"
import type z from "zod"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import { authClient } from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import { LogInFieldsSchema } from "~/types/auth"

export const Route = createFileRoute("/(auth)/login/")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const defaultValues: z.output<typeof LogInFieldsSchema> = {
    identifier: "",
    password: "",
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: LogInFieldsSchema },
    onSubmit: async ({ value }) => {
      try {
        const { identifier, password } = value
        const isEmail = identifier.includes("@")

        let error: { message?: string } | null = null

        if (isEmail) {
          const result = await authClient.signIn.email({
            email: identifier,
            password,
            rememberMe: false,
          })
          error = result.error
        } else {
          const result = await authClient.signIn.username({
            username: identifier,
            password,
            rememberMe: false,
          })
          error = result.error
        }

        if (error) {
          notifyError("Failed to log in", error.message)
        } else {
          navigate({ to: "/projects" })
        }
      } catch (error) {
        notifyError("Failed to log in", error)
      }
    },
  })

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="w-100 overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit(e)
          }}
        >
          <CardHeader className="m-4 flex justify-center">
            <h1 className="font-bold text-2xl text-olive-950">Sign In</h1>
          </CardHeader>
          <CardContent className="mb-8 flex flex-col gap-4">
            <form.AppField name="identifier">
              {(field) => <field.TextField label="Email or Username" placeholder="" />}
            </form.AppField>
            <form.AppField name="password">
              {(field) => <field.PasswordField label="Password" placeholder="" />}
            </form.AppField>
          </CardContent>
          <CardFooter className="my-4 flex flex-col justify-center gap-4">
            <div className="w-full text-center">
              <form.Subscribe
                selector={(formState) => [
                  formState.isValid,
                  formState.isSubmitting,
                  formState.isDirty,
                ]}
              >
                {([isValid, isSubmitting, _isDirty]) => (
                  <Button type="submit" disabled={!isValid} className="w-48 border">
                    {isSubmitting ? (
                      <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                    ) : (
                      <span>Sign In</span>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
