import { createFileRoute, Navigate, redirect, useNavigate } from "@tanstack/react-router"
import type z from "zod"
import { Button } from "~/components/ui/button"
import { useAppForm } from "~/hooks/use-app-form"
import { authClient } from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import { NewProyectSchema } from "~/types/proyect"
import { addProject } from "./-actions/addProject"
import { getProjectsNames } from "./-actions/get-projects-names"

export const Route = createFileRoute("/_app/projects/add/")({
  component: RouteComponent,
  loader: async () => {
    return {
      session: await authClient.getSession(),
      projects: await getProjectsNames({ data: { userId: "dummy" } }),
    }
  },
})

function RouteComponent() {
  const { session, projects } = Route.useLoaderData()
  const navigate = useNavigate()

  const defaultValues: z.output<typeof NewProyectSchema> = {
    name: "",
    existingProjectsNames: projects.map((p) => p.name),
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: NewProyectSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const userId = session.data?.user.id!
        const name = value.name
        const _project = await addProject({ data: { userId, name } })
        navigate({ to: "/projects" })
      } catch (error) {
        notifyError("Failed to create new project", error)
      }
    },
  })

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 font-bold text-2xl">New Project</h1>
      <form.AppField name="name">
        {(field) => <field.TextField label="Project name" placeholder="New proyect" />}
      </form.AppField>
      <form.Subscribe
        selector={(formState) => [formState.isValid, formState.isSubmitting, formState.isDirty]}
      >
        {([isValid, isSubmitting, isDirty]) => (
          <div className="flex w-full justify-end pt-10">
            <Button
              //logIn("santiagoandresponteahon@hotmail.com", "12345678")
              disabled={!isValid}
              className="border"
              onClick={form.handleSubmit}
            >
              {isSubmitting ? (
                <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
              ) : (
                <span>Create</span>
              )}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </div>
  )
}
