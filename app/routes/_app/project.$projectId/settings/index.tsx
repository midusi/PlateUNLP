import { createFileRoute, notFound } from "@tanstack/react-router";
import type { Breadcrumbs } from "../../-components/AppBreadcrumbs";
import { getProject } from "../-actions/get-project";

export const Route = createFileRoute("/_app/project/$projectId/settings/")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const { projectId } = params;
		const project = await getProject({ data: { projectId: projectId } });
		if (!project) throw notFound();

		return {
			breadcrumbs: [
				{ title: "Projects", link: { to: "/projects" } },
				{
					title: project.name,
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
			project,
		};
	},
});

function RouteComponent() {
	const { project } = Route.useLoaderData();

	return <div className="w-full">Hola project settings</div>;
}
