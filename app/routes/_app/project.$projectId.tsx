import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router"
import { addPlate } from "./-actions/add-plate"
import { getProject } from "./-actions/get-project"
import type { Breadcrumbs } from "./-components/AppBreadcrumbs"

export const Route = createFileRoute("/_app/project/$projectId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const project = await getProject({ data: { projectId: params.projectId } })
    if (!project) throw notFound()
    return {
      breadcrumbs: [
        {
          title: project.name,
          link: { to: "/project/$projectId", params: { projectId: project.id } },
        },
      ] satisfies Breadcrumbs,
      project,
    }
  },
})

function RouteComponent() {
  const navigate = useNavigate()
  const { project } = Route.useLoaderData()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <h1 className="font-medium text-xl underline">{project.name}</h1>
      <form
        className="rounded-lg border-2 border-accent"
        onSubmit={async (e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          const result = await addPlate({ data })
          if (result.success) {
            navigate({
              to: "/plate/$plateId",
              params: { plateId: result.plateId },
            })
          } else {
            alert(result.error)
          }
        }}
      >
        <input type="hidden" name="projectId" value={project.id} />
        <input type="file" accept="image/*" className="focus:outline-none" name="plate" />
        <button type="submit" className="rounded-w-lg bg-accent px-2 text-white">
          Subir imagen
        </button>
      </form>
      {project.plates.map((plate) => (
        <p key={plate.id} className="underline">
          <Link to="/plate/$plateId" params={{ plateId: plate.id }}>
            {plate["PLATE-N"] || <span className="italic">sin nombre</span>}
          </Link>
        </p>
      ))}
    </div>
  )
}
