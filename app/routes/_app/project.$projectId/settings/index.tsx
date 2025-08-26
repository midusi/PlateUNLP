import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import type z from "zod";
import { Button } from "~/components/ui/button";
import { useAppForm } from "~/hooks/use-app-form";
import { authClient } from "~/lib/auth-client";
import { notifyError } from "~/lib/notifications";
import { EditProyectSchema } from "~/types/proyect";
import type { Breadcrumbs } from "../../-components/AppBreadcrumbs";
import { getProjectWithAuthLists } from "./-actions/get-project-with-auth-lists";
import { getProjectsNames } from "./-actions/get-projects-names";
import { getUsers } from "./-actions/get-users";
import { updateProject } from "./-actions/update-project";

export const Route = createFileRoute("/_app/project/$projectId/settings/")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const session = await authClient.getSession();
		const userId = session.data?.user.id as string;
		const projects_names = await getProjectsNames({ data: { userId: userId } });
		const other_users = (await getUsers({ data: {} })).filter(
			(user) => user.id !== userId,
		) as {
			id: string;
			name: string;
			email: string;
			image: string;
		}[];
		const { projectId } = params;
		const project = await getProjectWithAuthLists({
			data: { projectId: projectId },
		});
		if (!project) throw notFound();

		return {
			userId,
			project,
			projects_names,
			other_users,
			breadcrumbs: [
				{ title: "Projects", link: { to: "/projects" } },
				{
					title: project.name as string,
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
	const { userId, project, projects_names, other_users } =
		Route.useLoaderData();
	const navigate = useNavigate();

	const defaultValues: z.output<typeof EditProyectSchema> = {
		oldName: project.name as string,
		oldEditors: project.editors as string[],
		oldViewers: project.viewers as string[],
		name: project.name as string,
		otherProjectsNames: projects_names
			.filter((p) => p.id !== project.id)
			.map((p) => p.name),
		editors: project.editors as string[],
		viewers: project.viewers as string[],
	};

	const form = useAppForm({
		defaultValues,
		validators: { onChange: EditProyectSchema },
		onSubmit: async ({ value, formApi: _ }) => {
			try {
				const name = value.name;
				const editors = value.editors;
				const viewers = value.viewers;
				const projectId = project.id as string;
				const _project = await updateProject({
					data: { userId, projectId, name, editors, viewers },
				});
				navigate({ to: "/project/$projectId", params: { projectId } });
			} catch (error) {
				notifyError("Failed to edit project settings", error);
			}
		},
	});

	return (
		<div className="flex w-full flex-col">
			<h1 className="mb-6 font-bold text-2xl">Project Settings</h1>
			<div className="flex flex-col gap-6">
				<form.AppField name="name">
					{(field) => (
						<field.TextField label="Project name" placeholder="New proyect" />
					)}
				</form.AppField>
				<div className="grid grid-cols-1 gap-12 md:grid-cols-2">
					<form.AppField name="editors">
						{(field) => (
							<field.SelectUsersField label="Editors" users={other_users} />
						)}
					</form.AppField>
					<form.AppField name="viewers">
						{(field) => (
							<field.SelectUsersField label="Viewers" users={other_users} />
						)}
					</form.AppField>
				</div>
			</div>
			<form.Subscribe
				selector={(formState) => [
					formState.isValid,
					formState.isSubmitting,
					formState.isDirty,
				]}
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
								<span>Save</span>
							)}
						</Button>
					</div>
				)}
			</form.Subscribe>
		</div>
	);
}
