import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod/v4"
import { getObservatoriesQueryOptions } from "~/components/forms/SelectObservatory"
import { db } from "~/db"
import type { Breadcrumbs } from "../-components/AppBreadcrumbs"
import { getObservations } from "./-actions/get-observations"
import { ObservationsList } from "./-components/ObservationsList"
import { PlateMetadataForm } from "./-components/PlateMetadataForm"

const getInitialValues = createServerFn()
  .validator(z.object({ plateId: z.string() }))
  .handler(async ({ data }) => {
    const plate = await db.query.plate.findFirst({
      where: (plate, { eq }) => eq(plate.id, data.plateId),
      columns: {
        OBSERVAT: true,
        "PLATE-N": true,
        OBSERVER: true,
        DIGITALI: true,
        SCANNER: true,
        SOFTWARE: true,
        TELESCOPE: true,
        DETECTOR: true,
        INSTRUMENT: true,
      },
      with: {
        project: { columns: { id: true, name: true } },
      },
    })
    if (!plate) {
      throw new Error(`Plate with ID ${data.plateId} not found`)
    }
    return plate
  })

export const Route = createFileRoute("/_app/plate/$plateId/")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const initialValues = await getInitialValues({
      data: { plateId: params.plateId },
    })
    const initialObservations = await getObservations({
      data: { plateId: params.plateId },
    })
    await context.queryClient.ensureQueryData(getObservatoriesQueryOptions())
    return {
      breadcrumbs: [
        {
          title: initialValues.project.name,
          link: {
            to: "/project/$projectId",
            params: { projectId: initialValues.project.id },
          },
        },
        {
          title: `Plate ${initialValues["PLATE-N"] || params.plateId}`,
          link: { to: "/plate/$plateId", params: { plateId: params.plateId } },
        },
      ] satisfies Breadcrumbs,
      initialValues,
      initialObservations,
    }
  },
})

function RouteComponent() {
  const { plateId } = Route.useParams()
  const { initialValues, initialObservations } = Route.useLoaderData()

  return (
    <div className="max-w-6xl mx-auto px-8">
      <PlateMetadataForm plateId={plateId} defaultValues={initialValues} />
      <div className="h-8" />
      <ObservationsList plateId={plateId} initialObservations={initialObservations} />
    </div>
  )
}
