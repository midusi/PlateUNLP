import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { db } from "~/db"

const getProjects = createServerFn().handler(async () => {
  const projects = await db.query.project.findMany()
  return projects
})

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async () => ({ projects: await getProjects() }),
})

function RouteComponent() {
  const { projects } = Route.useLoaderData()

  return (
    <ul className="h-full flex flex-col items-center justify-center gap-4">
      {projects.map(({ id, name }) => (
        <li key={id} className="underline text-blue-500">
          <Link to="/projects/$projectId" params={{ projectId: id }}>
            {name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
