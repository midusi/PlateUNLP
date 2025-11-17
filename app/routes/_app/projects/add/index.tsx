import { createFileRoute } from "@tanstack/react-router"
import type z from "zod"
import { Button } from "~/components/ui/button"
import { useAppForm } from "~/hooks/use-app-form"
import { authClient } from "~/lib/auth-client"
import { notifyError } from "~/lib/notifications"
import { NewProyectSchema } from "~/types/proyect"
import type { Breadcrumbs } from "../../-components/AppBreadcrumbs"
import { addProject } from "./-actions/add-project"
import { getProjectsNames } from "./-actions/get-projects-names"
import { getUsers } from "./-actions/get-users"

export const Route = createFileRoute("/_app/projects/add/")({
  component: RouteComponent,
  loader: async () => {
    const session = await authClient.getSession()
    const userId = session.data?.user.id as string
    const projects = await getProjectsNames({ data: { userId: userId } })
    const users = await getUsers()
    return {
      breadcrumbs: [
        { title: "Projects", link: { to: "/projects" } },
        {
          title: "New Project",
          link: { to: "/projects/add" },
        },
      ] satisfies Breadcrumbs,
      session: session,
      projects: projects,
      users: users,
    }
  },
})

function RouteComponent() {
  const { session, projects, users } = Route.useLoaderData()

  const userId = session.data?.user.id!
  const defaultValues: z.output<typeof NewProyectSchema> = {
    name: "",
    existingProjectsNames: projects.map((p) => p.name),
    usersRoles: [{ id: userId, role: "owner" }],
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: NewProyectSchema },
    onSubmit: async ({ value, formApi: _ }) => {
      try {
        const userId = session.data?.user.id as string
        const name = value.name
        const editors = value.usersRoles.filter((u) => u.role === "editor").map((u) => u.id)
        const viewers = value.usersRoles.filter((u) => u.role === "viewer").map((u) => u.id)
        const _project = await addProject({
          data: { userId, name, editors, viewers },
        })
        //navigate({ to: "/projects" })
      } catch (error) {
        notifyError("Failed to create new project", error)
      }
    },
  })

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 font-bold text-2xl">New Project</h1>
      <div className="flex flex-col gap-6">
        <form.AppField name="name">
          {(field) => <field.TextField label="Project name" placeholder="New proyect" />}
        </form.AppField>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <form.AppField name="usersRoles">
            {(field) => (
              <field.SelectUsersField
                ownerId={userId as string}
                label="Permissions"
                users={users}
              />
            )}
          </form.AppField>
        </div>
      </div>
      <form.Subscribe
        selector={(formState) => [formState.isValid, formState.isSubmitting, formState.isDirty]}
      >
        {([isValid, isSubmitting, isDirty]) => (
          <div className="flex w-full justify-end pt-10">
            <Button
              //logIn("santiagoandresponteahon@hotmail.com", "12345678")
              disabled={!isValid || !isDirty}
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
