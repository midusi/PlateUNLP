import { createFileRoute, notFound, redirect, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import type z from "zod"
import { SelectUsers } from "~/components/forms/select-users"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import { breadcrumb } from "~/lib/breadcrumbs"
import { notifyError, notifySucces } from "~/lib/notifications"
import { EditProyectSchema } from "~/types/proyect"
import { getSession } from "../../-actions/get-session"
import { deleteProject } from "./-actions/delete-project"
import { getProjectWithAuthLists } from "./-actions/get-project-with-auth-lists"
import { getProjectsNames } from "./-actions/get-projects-names"
import { getUsers } from "./-actions/get-users"
import { updateProject } from "./-actions/update-project"

export const Route = createFileRoute("/_app/project/$projectId/settings/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const { projectId } = params

    const session = await getSession()
    if (session?.user.role !== "admin") {
      throw redirect({ to: "/project/$projectId", params: { projectId } })
    }

    const projects_names = await getProjectsNames({ data: { userId: session.user.id } })
    const users = await getUsers()

    const project = await getProjectWithAuthLists({
      data: { projectId },
    })

    if (!project) throw notFound()

    return {
      project,
      projects_names,
      users,
      breadcrumbs: [
        breadcrumb({
          title: "Projects",
          to: "/projects",
        }),
        breadcrumb({
          title: project.name,
          to: "/project/$projectId",
          params: { projectId: project.id },
        }),
        breadcrumb({
          title: "Settings",
          to: "/project/$projectId/settings",
          params: { projectId: project.id },
        }),
      ],
    }
  },
})

function RouteComponent() {
  const { project, projects_names, users } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isDeleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const defaultValues: z.output<typeof EditProyectSchema> = {
    oldName: project.name as string,
    oldUsersRoles: project.permissions!,
    name: project.name as string,
    otherProjectsNames: projects_names.filter((p) => p.id !== project.id).map((p) => p.name),
    usersRoles: project.permissions!,
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: EditProyectSchema },
    onSubmit: async ({ value }) => {
      try {
        const projectId = project.id as string
        await updateProject({
          data: { projectId, name: value.name, usersRoles: value.usersRoles },
        })
        notifySucces("Project updated")
        navigate({ to: "/project/$projectId", params: { projectId } })
      } catch (error) {
        notifyError("Failed to update project", error)
      }
    },
  })

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteProject({ data: { projectId: project.id } })
      notifySucces("Project deleted")
      navigate({ to: "/projects" })
    } catch (error) {
      notifyError("Failed to delete project", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <h1 className="mb-6 font-bold text-2xl text-olive-950 tracking-tight">Project Settings</h1>
        <Card>
          <CardContent className="flex flex-col gap-6">
            <form.AppField name="name">
              {(field) => <field.TextField label="Project name" placeholder="Project name" />}
            </form.AppField>
            <form.AppField name="usersRoles">
              {(field) => (
                <SelectUsers
                  label="Permissions"
                  users={users}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.AppField>
          </CardContent>
          <CardFooter className="justify-end">
            <form.Subscribe
              selector={(formState) => [
                formState.isValid,
                formState.isSubmitting,
                formState.isDirty,
              ]}
            >
              {([isValid, isSubmitting, isDirty]) => (
                <Button
                  disabled={!isValid || !isDirty}
                  className="border"
                  onClick={form.handleSubmit}
                >
                  {isSubmitting ? (
                    <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </CardFooter>
        </Card>
      </div>

      <Card className="border-red-300">
        <CardHeader>
          <h2 className="font-bold text-lg text-red-600">Danger Zone</h2>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium text-olive-950">Delete this project</p>
            <p className="text-olive-500 text-sm">
              This will permanently delete the project, all its plates, and observations.
            </p>
          </div>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <span className="icon-[ph--trash-bold] size-4" />
            Delete Project
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{project.name}</strong>? All plates and
              observations will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose>Cancel</AlertDialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
              ) : (
                <span>Delete Project</span>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
