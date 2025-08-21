import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { createAuthClient } from "better-auth/react"
import { getMaxListeners } from "events"
import type z from "zod"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { env } from "~/env"
import { useAppForm } from "~/hooks/use-app-form"
import { authClient } from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import { LogInFieldsSchema } from "~/types/auth"

export const Route = createFileRoute("/(auth)/login/")({
  component: RouteComponent,
})

function RouteComponent() {
  const defaultValues: z.output<typeof LogInFieldsSchema> = {
    email: "",
    password: "",
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: LogInFieldsSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const email = value.email
        const password = value.password
        const { data, error } = await authClient.signIn.email(
          {
            email,
            password,
            /** A URL to redirect to after the user verifies their email (optional) */
            callbackURL: "/projects",
            /**
             * remember the user session after the browser is closed.
             * @default true
             */
            rememberMe: false,
          },
          {
            //callbacks
          },
        )
        error && notifyError("Failed to log in", error.message)
        formApi.reset(value)
      } catch (error) {
        notifyError("Failed to log in", error)
      }
    },
  })

  const { mutate: googleLogIn, isPending: isGoogleLogIning } = useMutation({
    mutationFn: async () => {
      try {
        const data = await authClient.signIn.social({
          provider: "google",
          callbackURL: "/projects",
        })
      } catch (error) {
        notifyError("Failed to log in with Google account", error)
      }
    },
  })

  const { mutate: githubLogIn, isPending: isGitHubLogIning } = useMutation({
    mutationFn: async () => {
      try {
        const data = await authClient.signIn.social({
          provider: "github",
          callbackURL: "/projects",
        })
      } catch (error) {
        notifyError("Failed to log in with GitHub account", error)
      }
    },
  })

  return (
    <div className="flex h-full w-full max-w-6xl items-center justify-center">
      <Card className="w-[400px] overflow-hidden">
        <CardHeader className="m-4 flex justify-center">
          <h1 className="text-2xl">Sign In</h1>
        </CardHeader>
        <CardContent className="m-4 flex flex-col gap-4">
          <form.AppField name="email">
            {(field) => <field.TextField label="Email" placeholder="" />}
          </form.AppField>
          <form.AppField name="password">
            {(field) => <field.PasswordField label="Password" placeholder="" />}
          </form.AppField>
          <Button
            variant="outline"
            className="flex w-full items-center justify-center gap-2 rounded-none border border-gray-300 bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => {
              googleLogIn()
            }}
            disabled={isGoogleLogIning}
          >
            {isGoogleLogIning ? (
              <>
                <span className="icon-[ph--spinner-bold] animate-spin text-gray-600" />
                <span className="text-gray-600">Signing in...</span>
              </>
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  className="h-5 w-5"
                />
                <span>Sign in with Google</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex w-full items-center justify-center gap-2 rounded-none border border-gray-300 bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => {
              githubLogIn()
            }}
            disabled={isGitHubLogIning}
          >
            {isGitHubLogIning ? (
              <>
                <span className="icon-[ph--spinner-bold] animate-spin text-gray-600" />
                <span className="text-gray-600">Signing in...</span>
              </>
            ) : (
              <>
                <img
                  src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                  alt="GitHub logo"
                  className="h-5 w-5"
                />
                <span>Sign in with GitHub</span>
              </>
            )}
          </Button>
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
                  <span>Sign In</span>
                )}
              </Button>
            )}
          </form.Subscribe>

          <div className="p-2 text-gray-600 text-sm">
            Don’t have an account?{" "}
            <a href="/register" className="font-medium hover:underline">
              Sign up
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
