import { createFileRoute, Link } from "@tanstack/react-router"
import { Card, CardContent, CardHeader } from "~/components/ui/card"
import type { Breadcrumbs } from "../-components/AppBreadcrumbs"
import { getProjectsWithMetrics } from "./-actions/get-projects-with-metrics"

export const Route = createFileRoute("/_app/projects/")({
  component: RouteComponent,
  loader: async () => ({
    breadcrumbs: [{ title: "Projects", link: { to: "/projects" } }] satisfies Breadcrumbs,
    projects: await getProjectsWithMetrics({ data: { userId: "dummy" } }),
  }),
})

function RouteComponent() {
  const { projects } = Route.useLoaderData()

  return (
    <div className="w-full">
      <h1 className="mb-6 font-bold text-2xl">Projects</h1>
      <ul className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(({ id, name, countPlates, countObservations }) => (
          <li key={id}>
            <Link
              to="/project/$projectId"
              className="flex items-center justify-center"
              params={{ projectId: id }}
            >
              <Card className="h-[220px] w-full rounded-2xl shadow-md transition-shadow hover:shadow-lg">
                <CardHeader className="border-b py-0">{name}</CardHeader>
                <CardContent className="text-gray-600">
                  <dl className="flex flex-col">
                    <div className="flex justify-between">
                      <dt>Count Plates</dt>
                      <dd>{countPlates}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Count Observations</dt>
                      <dd>{countObservations}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
