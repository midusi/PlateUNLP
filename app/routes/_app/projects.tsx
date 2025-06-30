import { createFileRoute, Link } from "@tanstack/react-router"
import { getProjects } from "./-actions/get-projects"
import type { Breadcrumbs } from "./-components/AppBreadcrumbs"

export const Route = createFileRoute("/_app/projects")({
  component: RouteComponent,
  loader: async () => ({
    breadcrumbs: [{ title: "Projects", link: { to: "/projects" } }] satisfies Breadcrumbs,
    projects: await getProjects({ data: { userId: "dummy" } }),
  }),
})

function RouteComponent() {
  const { projects } = Route.useLoaderData()

  return (
    <ul className="h-full flex flex-col items-center justify-center gap-4">
      {projects.map(({ id, name }) => (
        <li key={id} className="underline text-blue-500">
          <Link to="/project/$projectId" params={{ projectId: id }}>
            {name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
