import { createFileRoute } from "@tanstack/react-router"
import { fetchGrayscaleImage } from "~/lib/image"
import { getPlateName } from "~/routes/_app/plate.$plateId/-actions/get-plate-name"
import { getProjectName } from "~/routes/_app/project.$projectId/-actions/get-project-name"
import type { Breadcrumbs } from "../../-components/AppBreadcrumbs"
import { getObservationMetadata } from "../-actions/get-observation-metadata"
import { getSpectrums } from "../-actions/get-spectrums"

export const Route = createFileRoute("/_app/observation/$observationId/calibrate")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const [project, plate, initialMetadata, spectrums] = await Promise.all([
      getProjectName({ data: { from: "observation", id: params.observationId } }),
      getPlateName({ data: { from: "observation", id: params.observationId } }),
      getObservationMetadata({ data: { observationId: params.observationId } }),
      getSpectrums({ data: { observationId: params.observationId } }),
    ])
    const rawImage = await fetchGrayscaleImage(`/observation/${params.observationId}/image`)
    return {
      breadcrumbs: [
        {
          title: project.name,
          link: {
            to: "/project/$projectId",
            params: { projectId: project.id },
          },
        },
        {
          title: `Plate ${plate["PLATE-N"]}`,
          link: { to: "/plate/$plateId", params: { plateId: plate.id } },
        },
        {
          title: `Observation ${initialMetadata["MAIN-ID"] || params.observationId}`,
          link: {
            to: "/observation/$observationId",
            params: { observationId: params.observationId },
          },
        },
      ] satisfies Breadcrumbs,
      initialMetadata,
      spectrums,
      rawImage,
    }
  },
})

function RouteComponent() {
  const { observationId } = Route.useParams()
  const { initialMetadata, spectrums, rawImage } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full max-w-6xl px-8">
      A calibrar...
    </div>
  )
}
