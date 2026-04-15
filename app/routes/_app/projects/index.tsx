import { createFileRoute, Link } from "@tanstack/react-router"
import clsx from "clsx"
import { Card, CardContent, CardHeader } from "~/components/ui/card"
import { getSession } from "../-actions/get-session"
import { getProjectsWithMetrics } from "./-actions/get-projects-with-metrics"

export const Route = createFileRoute("/_app/projects/")({
  component: RouteComponent,
  loader: async () => {
    const session = await getSession()
    const user = session!.user
    const userId = user.id as string

    return {
      user: user,
      projects: await getProjectsWithMetrics({ data: { userId: userId } }),
    }
  },
})

function RouteComponent() {
  const { user, projects } = Route.useLoaderData()

  return (
    <div className="w-full">
      <h1 className="mb-6 font-bold text-2xl text-olive-950 tracking-tight">Projects</h1>
      <ul className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(({ id, name, countPlates, countObservations }) => (
          <li key={id}>
            <Link
              to="/project/$projectId"
              className="flex items-center justify-center"
              params={{ projectId: id }}
            >
              <Card className="h-[220px] w-full transition-colors hover:border-olive-400">
                <CardHeader className="border-b border-olive-300 py-0">{name}</CardHeader>
                <CardContent className="text-olive-500">
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
        {user.role === "admin" && (
          <li key="new-project">
            <Link to="/projects/add" className="flex items-center justify-center">
              <Card
                className={clsx(
                  "h-[220px] w-full border-1 border-dashed",
                  "border-olive-300 hover:bg-white",
                  "bg-olive-100 hover:border-olive-500",
                  "transition-colors",
                )}
              >
                <CardContent className="flex h-full w-full flex-col items-center justify-center text-olive-300 hover:text-orange-600">
                  <span className="icon-[ph--plus-bold] size-12" />
                  <span className="mt-2 font-medium text-sm">New Project</span>
                </CardContent>
              </Card>
            </Link>
          </li>
        )}
      </ul>
    </div>
  )
}
