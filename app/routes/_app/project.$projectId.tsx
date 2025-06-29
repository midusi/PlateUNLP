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
          link: {
            to: "/project/$projectId",
            params: { projectId: project.id },
          },
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
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-medium underline">{project.name}</h1>
      <form
        className="border-2 border-accent rounded-lg"
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
        <button type="submit" className="bg-accent text-white px-2 rounded-w-lg">
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
