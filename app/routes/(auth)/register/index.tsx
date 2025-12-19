import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import type z from "zod"
import defaultUserImage from "~/assets/avatar.png"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import { authClient } from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import { LogUpFieldsSchema } from "~/types/auth"

export const Route = createFileRoute("/(auth)/register/")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const defaultValues: z.output<typeof LogUpFieldsSchema> = {
    email: "",
    password: "",
    name: "",
    image: null,
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: LogUpFieldsSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const email = value.email
        const password = value.password
        const name = value.name
        const image = value.image || defaultUserImage
        console.log(image)
        const { data, error } = await authClient.signUp.email(
          {
            email, // user email address
            password, // user password -> min 8 characters by default
            image: image,
            name, // user display name
            callbackURL: "/login", // A URL to redirect to after the user verifies their email (optional)
          },
          {
            onRequest: (ctx) => {
              //show loading
            },
            onSuccess: (ctx) => {
              console.log("User signed up successfully:", ctx.data)
              //navigate({ to: "/login" })
            },
            onError: (ctx) => {
              // display the error message
              notifyError(ctx.error.message)
            },
          },
        )
        //formApi.reset(value)
      } catch (error) {
        notifyError("Failed to Sign Up", error)
      }
    },
  })

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="w-[400px] overflow-hidden">
        <form onSubmit={(e)=> {
          e.preventDefault()  
          form.handleSubmit(e)
        }} >
          <CardHeader className="m-4 flex justify-center">
            <h1 className="text-2xl">Sign Up</h1>
          </CardHeader>
          <CardContent className="m-4 flex flex-col gap-4">
            <form.AppField name="name">
              {(field) => <field.TextField label="Username" placeholder="" />}
            </form.AppField>
            <form.AppField name="image">
              {(field) => <field.ImageField label="Imagen" maxHeight={512} maxWidth={512}/>}
            </form.AppField>
            <form.AppField name="email">
              {(field) => <field.TextField label="Email" placeholder="" />}
            </form.AppField>
            <form.AppField name="password">
              {(field) => <field.PasswordField label="Password" placeholder="" />}
            </form.AppField>
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
                  className="mt-4 w-48 border"
                  type="submit"
                >
                  {isSubmitting ? (
                    <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                  ) : (
                    <span>Sign Up</span>
                  )}
                </Button>
              )}
            </form.Subscribe>

            <div className="p-2 text-gray-600 text-sm">
              Already have an account?{" "}
              <a href="/login" className="font-medium hover:underline">
                Sign in
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
