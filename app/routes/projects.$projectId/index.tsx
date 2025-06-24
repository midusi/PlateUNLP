import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod/v4"
import { db } from "~/db"
import * as s from "~/db/schema"
import { uploadFile } from "~/utils/uploads"

const getProjectInfo = createServerFn()
  .validator(z.object({ projectId: z.string() }))
  .handler(async ({ data }) => {
    const project = await db.query.project.findFirst({
      where: (t, { eq }) => eq(t.id, data.projectId),
      with: {
        plates: true,
      },
    })
    return project
  })

const createPlate = createServerFn({ method: "POST" })
  .validator(z.instanceof(FormData))
  .handler(async ({ data }) => {
    const projectId = data.get("projectId")
    if (typeof projectId !== "string") return { success: false as const, error: "Malformed input" }

    const plate = data.get("plate")
    if (!(plate instanceof File)) return { success: false as const, error: "Missing file" }

    const imageId = await uploadFile(plate)
    if (imageId.isErr()) {
      return { success: false as const, error: imageId.error.message }
    }
    const result = await db
      .insert(s.plate)
      .values({ projectId, imageId: imageId.value })
      .returning({ id: s.plate.id })
    return { success: true as const, plateId: result[0].id }
  })

export const Route = createFileRoute("/projects/$projectId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const project = await getProjectInfo({ data: { projectId: params.projectId } })
    if (!project) throw notFound()
    return { project }
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
          const result = await createPlate({ data })
          if (result.success) {
            navigate({ to: "/plate/$plateId", params: { plateId: result.plateId } })
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
