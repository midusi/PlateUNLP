import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import type { Breadcrumbs } from "../../-components/AppBreadcrumbs";
import { getProject } from "../-actions/get-project";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";
import { useAppForm } from "~/hooks/use-app-form";
import { EditProyectSchema } from "~/types/proyect";
import { notifyError } from "~/lib/notifications";
import { getProjectsNames } from "./-actions/get-projects-names";
import { getUsers } from "./-actions/get-users";
import { getProjectWithAuthLists } from "./-actions/get-project-with-auth-lists";

export const Route = createFileRoute("/_app/project/$projectId/settings/")({
	component: RouteComponent,
	loader: async ({ params }) => {
		
		const session = await authClient.getSession()!
		const userId = session.data?.user.id!
		const projects_names = await getProjectsNames({ data: { userId: userId } })
		const other_users = (await getUsers({ data: {} })).filter((user) => user.id !== userId) as {
			id: string
			name: string
			email: string
			image: string
		}[]
		const { projectId } = params;
		const project = await getProjectWithAuthLists({ data: { projectId: projectId } });
		if (!project) throw notFound();

		return {
			project,
			projects_names,
			other_users,
			breadcrumbs: [
				{ title: "Projects", link: { to: "/projects" } },
				{
					title: project.name!,
					link: {
						to: "/project/$projectId",
						params: { projectId: project.id },
					},
				},
				{
					title: "Settings",
					link: {
						to: "/project/$projectId/settings",
						params: { projectId: project.id },
					},
				},
			] satisfies Breadcrumbs,
		};
	},
});

function RouteComponent() {
  const { session, project, projects_names, other_users } = Route.useLoaderData()
  const navigate = useNavigate()

  const defaultValues: z.output<typeof EditProyectSchema> = {
	oldName: project.name;
	oldEditors: project.editors;
	oldViewers: project.viewers;
	name: project.name,
	existingProjectsNames: projects_names.map((p) => p.name),
	editors: [],
	viewers: [],
  }

  const form = useAppForm({
	defaultValues,
	validators: { onChange: EditProyectSchema },
	onSubmit: async ({ value, formApi }) => {
	  try {
		const userId = session.data?.user.id!
		const name = value.name
		const editors = value.editors
		const viewers = value.viewers
		const _project = await editProject({ data: { userId, name, editors, viewers } })
		navigate({ to: "/projects" })
	  } catch (error) {
		notifyError("Failed to edit project settings", error)
	  }
	},
  })

  return (
	<div className="flex w-full flex-col">
	  <h1 className="mb-6 font-bold text-2xl">Project Settings</h1>
	  <div className="flex flex-col gap-6">
		<form.AppField name="name">
		  {(field) => <field.TextField label="Project name" placeholder="New proyect" />}
		</form.AppField>
		<div className="grid grid-cols-1 gap-12 md:grid-cols-2">
		  <form.AppField name="editors">
			{(field) => <field.SelectUsersField label="Editors" users={other_users} />}
		  </form.AppField>
		  <form.AppField name="viewers">
			{(field) => <field.SelectUsersField label="Viewers" users={other_users} />}
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
			  disabled={!isValid}
			  className="border"
			  onClick={form.handleSubmit}
			>
			  {isSubmitting ? (
				<span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
			  ) : (
				<span>Save</span>
			  )}
			</Button>
		  </div>
		)}
	  </form.Subscribe>
	</div>
  )
}
