import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { FITSExportButton } from "~/components/FITSExportButton"
import { getObservatoriesQueryOptions } from "~/components/forms/SelectObservatory"
import { Card, CardContent, CardHeader } from "~/components/ui/card"
import { breadcrumb } from "~/lib/breadcrumbs"
import { plateMetadataFields } from "~/lib/fits-export-fields"
import { getProjectName } from "~/routes/_app/project.$projectId/-actions/get-project-name"
import { DeletePlates } from "~/routes/_app/project.$projectId/-components/DeletePlates"
import { getObservations } from "./-actions/get-observations"
import { getPlateMetadata } from "./-actions/get-plate-metadata"
import { getPlateMetadataSuggestions } from "./-actions/get-plate-metadata-suggestions"
import { ObservationsList } from "./-components/ObservationsList"
import { PlateMetadataForm } from "./-components/PlateMetadataForm"

export const Route = createFileRoute("/_app/plate/$plateId/")({
  component: RouteComponent,
  ssr: "data-only",
  loader: async ({ context, params }) => {
    const [project, initialMetadata, initialObservations, suggestions] = await Promise.all([
      getProjectName({ data: { from: "plate", id: params.plateId } }),
      getPlateMetadata({ data: { plateId: params.plateId } }),
      getObservations({ data: { plateId: params.plateId } }),
      getPlateMetadataSuggestions({ data: { plateId: params.plateId } }),
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
      project,
      initialMetadata,
      initialObservations,
      suggestions,
    }
  },
})

function RouteComponent() {
  const { plateId } = Route.useParams()
  const { project, initialMetadata, initialObservations, suggestions } = Route.useLoaderData()
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full">
      <PlateMetadataForm
        plateId={plateId}
        defaultValues={initialMetadata}
        suggestions={suggestions}
      >
        {(values) => (
          <div className="my-8 flex justify-end">
            <FITSExportButton
              href={`/plate/${plateId}/fits`}
              variant="outline"
              fields={plateMetadataFields(values)}
            >
              <span className="icon-[ph--download-simple-bold]" />
              Download Plate
            </FITSExportButton>
          </div>
        )}
      </PlateMetadataForm>
      <ObservationsList plateId={plateId} initialObservations={initialObservations} />
      
      <Card className="border-red-300 mt-8">
        <CardHeader>
          <h2 className="font-bold text-lg text-red-600">Danger Zone</h2>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium text-olive-950">Delete this Plate</p>
            <p className="text-olive-500 text-sm">
              Deleting a plate is irreversible. All observations, spectra and calibrations associated
          with it will be permanently removed.
            </p>
          </div>
          <DeletePlates
          plateIds={[plateId]}
          onDeleted={() =>
            navigate({ to: "/project/$projectId", params: { projectId: project.id } })
          }
        />
        </CardContent>
      </Card>
    </div>
  )
}
