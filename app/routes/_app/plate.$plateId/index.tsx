import { createFileRoute } from "@tanstack/react-router"
import type { z } from "zod"
import { FITSExportButton } from "~/components/FITSExportButton"
import { getObservatoriesQueryOptions } from "~/components/forms/SelectObservatory"
import { breadcrumb } from "~/lib/breadcrumbs"
import { plateMetadataFields } from "~/lib/fits-export-fields"
import { getProjectName } from "~/routes/_app/project.$projectId/-actions/get-project-name"
import type { PlateMetadataSchema } from "~/types/spectrum-metadata"
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
      initialMetadata,
      initialObservations,
      suggestions,
    }
  },
})

function RouteComponent() {
  const { plateId } = Route.useParams()
  const { initialMetadata, initialObservations, suggestions } = Route.useLoaderData()

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
              Download FITS
            </FITSExportButton>
          </div>
        )}
      </PlateMetadataForm>
      <ObservationsList plateId={plateId} initialObservations={initialObservations} />
    </div>
  )
}
