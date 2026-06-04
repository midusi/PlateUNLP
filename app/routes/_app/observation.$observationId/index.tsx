import { createFileRoute, Link } from "@tanstack/react-router"
import type { z } from "zod"
import { FITSExportButton } from "~/components/FITSExportButton"
import { Button } from "~/components/ui/button"
import { breadcrumb } from "~/lib/breadcrumbs"
import { observationMetadataFields, plateMetadataFields } from "~/lib/fits-export-fields"
import { formatObservation } from "~/lib/format"
import { getPlateMetadata } from "~/routes/_app/plate.$plateId/-actions/get-plate-metadata"
import { getPlateName } from "~/routes/_app/plate.$plateId/-actions/get-plate-name"
import { getProjectName } from "~/routes/_app/project.$projectId/-actions/get-project-name"
import type { ObservationMetadataSchema } from "~/types/spectrum-metadata"
import { getObservationMetadata } from "./-actions/get-observation-metadata"
import { getSpectrums } from "./-actions/get-spectrums"
import { ObservationMetadataForm } from "./-components/ObservationMetadataForm"
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

async function RouteComponent() {
  const { observationId } = Route.useParams()
  const { initialMetadata, plateMetadata, spectrums } = Route.useLoaderData()

  const plateFields = plateMetadataFields(plateMetadata)

  return (
    <div className="mx-auto w-full">
      <ObservationMetadataForm
        observationId={observationId}
        defaultValues={initialMetadata}
        OBSERVAT={initialMetadata.OBSERVAT}
      >
        {(form) => (
          <>
            <div className="h-8" />
            <SpectrumsList observationId={observationId} initialSpectrums={spectrums} />
            <div className="h-8" />
            <SpectrumsExtractor observationId={observationId} spectrums={spectrums} />

            <form.Subscribe selector={(s) => s.values}>
              {(values: z.output<typeof ObservationMetadataSchema>) => {
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
                    <Link
                      to="/observation/$observationId/calibrate"
                      params={{ observationId: observationId }}
                    >
                      <Button className="flex justify-center">Calibrate</Button>
                    </Link>
                  </div>
                )
              }}
            </form.Subscribe>
          </>
        )}
      </ObservationMetadataForm>
    </div>
  )
}
