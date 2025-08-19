import { createFileRoute } from "@tanstack/react-router"
import { createAuthClient } from "better-auth/react"
import { getMaxListeners } from "events"
import z from "zod"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import {authClient} from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import { LogInFieldsSchema } from "~/types/auth"

export const Route = createFileRoute("/login/")({
  component: RouteComponent,
})

function RouteComponent() {

  const defaultValues: z.output<typeof LogInFieldsSchema> = {email: "", password: ""}
  
  const form = useAppForm({
      defaultValues,
      validators: { onChange: LogInFieldsSchema },
      onSubmit: async ({ value, formApi }) => {
        try {
          const email = value.email
          const password = value.password
          const { data, error } = await authClient.signIn.email({
              email,
              password,
              /** A URL to redirect to after the user verifies their email (optional) */
              callbackURL: "/projects",
              /**
               * remember the user session after the browser is closed. 
               * @default true
               */
              rememberMe: false
          }, {
              //callbacks
          })
          error && notifyError("Failed to log in", error)
          formApi.reset(value)
        } catch (error) {
          notifyError("Failed to log in", error)
        }
      },
    })

  const logUp = async (email:string, password:string, name:string) => {
    const { data, error } = await authClient.signUp.email({
        email, // user email address
        password, // user password -> min 8 characters by default
        name, // user display name
        callbackURL: "/" // A URL to redirect to after the user verifies their email (optional)
    }, {
        onRequest: (ctx) => {
            //show loading
        },
        onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
            console.log("Log Up:", ctx.data)
        },
        onError: (ctx) => {
            // display the error message
            alert(ctx.error.message);
        },
    });
  }

  return <div className="h-full w-full max-w-6xl flex justify-center items-center">
      <Card className="overflow-hidden w-[400px]">
          <CardHeader className="m-4 flex justify-center">
            <h1 className="text-2xl">Log In</h1>
          </CardHeader>
          <CardContent className="m-4 flex flex-col gap-4">
            <form.AppField name="email">
              {(field) => <field.TextField label="Email" placeholder="" />}
            </form.AppField>
            <form.AppField name="password">
              {(field) => <field.PasswordField label="Password" placeholder="" />}
            </form.AppField>
          </CardContent>
          <CardFooter className="m-4 flex justify-center">
            {/* <Button onClick={()=>logUp("santiagoandresponteahon@hotmail.com", "12345678", "santiago")}>Registrar Usuario</Button> */}
            <form.Subscribe
              selector={(formState) => [
                formState.isValid,
                formState.isSubmitting,
                formState.isDirty,
              ]}
            >
              {([isValid, isSubmitting, isDirty]) => (
                <Button 
                  //logIn("santiagoandresponteahon@hotmail.com", "12345678")
                  disabled={!isValid}
                  className="w-full border"
                  onClick={form.handleSubmit}
                >
                  {isSubmitting 
                    ? <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" /> 
                    : <span>Log In</span>}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </Card>
    </div>
}
