import { createFileRoute } from "@tanstack/react-router"
import { getObservatoriesQueryOptions } from "~/components/forms/SelectObservatory"
import { breadcrumb } from "~/lib/breadcrumbs"
import { getProjectName } from "~/routes/_app/project.$projectId/-actions/get-project-name"
import { getObservations } from "./-actions/get-observations"
import { getPlateMetadata } from "./-actions/get-plate-metadata"
import { ObservationsList } from "./-components/ObservationsList"
import { PlateMetadataForm } from "./-components/PlateMetadataForm"

export const Route = createFileRoute("/_app/plate/$plateId/")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const [project, initialMetadata, initialObservations] = await Promise.all([
      getProjectName({ data: { from: "plate", id: params.plateId } }),
      getPlateMetadata({ data: { plateId: params.plateId } }),
      getObservations({ data: { plateId: params.plateId } }),
    ])
    await context.queryClient.ensureQueryData(getObservatoriesQueryOptions()) // For the PlateMetadataForm

    return {
      breadcrumbs: [
        breadcrumb({
          title: project.name,
          to: "/project/$projectId",
          params: { projectId: project.id },
        }),
        breadcrumb({
          title: `${initialMetadata["PLATE-N"]}`,
          to: "/plate/$plateId",
          params: { plateId: params.plateId },
        }),
      ],
      initialMetadata,
      initialObservations,
    }
  },
})

function RouteComponent() {
  const { plateId } = Route.useParams()
  const { initialMetadata, initialObservations } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full">
      <PlateMetadataForm plateId={plateId} defaultValues={initialMetadata} />
      <div className="h-8" />
      <ObservationsList plateId={plateId} initialObservations={initialObservations} />
    </div>
  )
}
