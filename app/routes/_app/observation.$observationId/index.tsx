import { useStore } from "@tanstack/react-form"
import { createFileRoute, Link } from "@tanstack/react-router"
import { FITSExportButton, type FITSExportField } from "~/components/FITSExportButton"
import { Button } from "~/components/ui/button"
import { breadcrumb } from "~/lib/breadcrumbs"
import { observationMetadataFields, plateMetadataFields } from "~/lib/fits-export-fields"
import { formatObservation } from "~/lib/format"
import { getPlateMetadata } from "~/routes/_app/plate.$plateId/-actions/get-plate-metadata"
import { getPlateName } from "~/routes/_app/plate.$plateId/-actions/get-plate-name"
import { getProjectName } from "~/routes/_app/project.$projectId/-actions/get-project-name"
import { getObservationMetadata } from "./-actions/get-observation-metadata"
import { getSpectrums } from "./-actions/get-spectrums"
import { ObservationMetadataForm, useObservationForm } from "./-components/ObservationMetadataForm"
import { SpectrumsExtractor } from "./-components/SpectrumsExtractor"
import { SpectrumsList } from "./-components/SpectrumsList"

export const Route = createFileRoute("/_app/observation/$observationId/")({
  component: RouteComponent,
  ssr: "data-only",
  loader: async ({ params }) => {
    const [project, plate, initialMetadata, spectrums] = await Promise.all([
      getProjectName({
        data: { from: "observation", id: params.observationId },
      }),
      getPlateName({ data: { from: "observation", id: params.observationId } }),
      getObservationMetadata({ data: { observationId: params.observationId } }),
      getSpectrums({ data: { observationId: params.observationId } }),
    ])
    const plateMetadata = await getPlateMetadata({ data: { plateId: plate.id } })
    return {
      breadcrumbs: [
        breadcrumb({
          title: project.name,
          to: "/project/$projectId",
          params: { projectId: project.id },
        }),
        breadcrumb({
          title: `${plate["PLATE-N"]}`,
          to: "/plate/$plateId",
          params: { plateId: plate.id },
        }),
        breadcrumb({
          title: formatObservation(initialMetadata),
          to: "/observation/$observationId",
          params: { observationId: params.observationId },
        }),
      ],
      initialMetadata,
      plateMetadata,
      spectrums,
    }
  },
})

function RouteComponent() {
  const { observationId } = Route.useParams()
  const { initialMetadata, plateMetadata, spectrums } = Route.useLoaderData()

  const plateFields = plateMetadataFields(plateMetadata)
  const form = useObservationForm({ observationId, defaultValues: initialMetadata })

  return (
    <div className="mx-auto w-full">
      <ObservationMetadataForm form={form} OBSERVAT={initialMetadata.OBSERVAT} />
      <div className="h-8" />
      <SpectrumsList observationId={observationId} initialSpectrums={spectrums} />
      <div className="h-8" />
      <SpectrumsExtractor observationId={observationId} spectrums={spectrums} />
      <ObservationExportBar form={form} plateFields={plateFields} observationId={observationId} />
    </div>
  )
}

/**
 * Export action bar. Lives outside the metadata form and subscribes to the live
 * values on its own so a keystroke only re-renders this bar — not the spectrum
 * list/extractor siblings.
 */
function ObservationExportBar({
  form,
  plateFields,
  observationId,
}: {
  form: ReturnType<typeof useObservationForm>
  plateFields: FITSExportField[]
  observationId: string
}) {
  const values = useStore(form.store, (s) => s.values)
  const exportFields = [...plateFields, ...observationMetadataFields(values)]

  return (
    <div className="m-4 flex w-full justify-center gap-4">
      <FITSExportButton
        href={`/observation/${observationId}/fits`}
        variant="outline"
        fields={exportFields}
      >
        <span className="icon-[ph--image]" />
        Download FITS (image)
      </FITSExportButton>
      <FITSExportButton
        href={`/observation/${observationId}/extracted-fits`}
        variant="outline"
        fields={exportFields}
      >
        <span className="icon-[ph--chart-line]" />
        Download FITS (extracted)
      </FITSExportButton>
      <Link to="/observation/$observationId/calibrate" params={{ observationId }}>
        <Button className="flex justify-center">Calibrate</Button>
      </Link>
    </div>
  )
}
