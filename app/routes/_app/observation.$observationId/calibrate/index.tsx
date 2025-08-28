import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { fetchGrayscaleImage } from "~/lib/image"
import { linearRegression } from "~/lib/utils"
import { getPlateName } from "~/routes/_app/plate.$plateId/-actions/get-plate-name"
import { getProjectName } from "~/routes/_app/project.$projectId/-actions/get-project-name"
import type { Breadcrumbs } from "../../-components/AppBreadcrumbs"
import { getObservationMetadata } from "../-actions/get-observation-metadata"
import { EmpiricalSpectrum } from "./-components/EmpiricalSpectrum"
import { ErrorScatterGraph } from "./-components/ErrorScatterGraph"
import { InferenceBoxGraph } from "./-components/InferenceBoxGraph"
import { ReferenceLampRangeUI } from "./-components/ReferenceLampRangeUI"
import { ReferenceLampSpectrum } from "./-components/ReferenceLampSpectrum"

export const Route = createFileRoute("/_app/observation/$observationId/calibrate/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const [project, plate, initialMetadata] = await Promise.all([
      getProjectName({
        data: { from: "observation", id: params.observationId },
      }),
      getPlateName({ data: { from: "observation", id: params.observationId } }),
      getObservationMetadata({ data: { observationId: params.observationId } }),
    ])
    return {
      breadcrumbs: [
        { title: "Projects", link: { to: "/projects" } },
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
        {
          title: `Calibrate`,
          link: {
            to: "/observation/$observationId/calibrate",
            params: { observationId: params.observationId },
          },
        },
      ] satisfies Breadcrumbs,
      initialMetadata,
    }
  },
})

function RouteComponent() {
  const { observationId } = Route.useParams()
  const { initialMetadata } = Route.useLoaderData()

  const lamp1Spectrum = [0, 1, 2, 3, 4, 7, 2, 3, 1, 4, 5, 1, 0].map((n, idx) => ({
    pixel: idx,
    intensity: n,
  }))
  const lamp2Spectrum = [0, 1, 2, 3, 4, 7, 2, 3, 1, 4, 5, 1, 0].map((n, idx) => ({
    pixel: idx,
    intensity: n,
  }))
  const scienceSpectrum = [0, 1, 2, 3, 4, 7, 2, 3, 1, 4, 5, 1, 0].map((n, idx) => ({
    pixel: idx,
    intensity: n,
  }))

  return (
    <>
      <Card className="mx-auto w-full max-w-6xl px-8">
        <CardContent>
          <CardTitle className="mb-4">Teorical Comparison Lamp</CardTitle>
          <ReferenceLampRangeUI />
        </CardContent>
        <ReferenceLampSpectrum />
      </Card>
      <Card>
        <CardContent>
          {/* Grafico de interacción para calibrar respecto a lampara teorica */}
          <div className="flex flex-col ">
            {/* Grafico espectro calibrado lampara 1 */}
            <div>
              <CardTitle className="mb-4">Empirical Comparison Lamp 1</CardTitle>
              <EmpiricalSpectrum data={lamp1Spectrum} color="#0ea5e9" interactable preview />
            </div>

            {/* Grafico espectro calibrado lampara 2 */}
            <div>
              <CardTitle className="mb-4">Empirical Comparison Lamp 2</CardTitle>
              <EmpiricalSpectrum data={lamp2Spectrum} color="#0ea5e9" interactable preview />
            </div>

            {/* Grafico espectro calibrado ciencia */}
            <div>
              <CardTitle className="mb-4">Empirical Science Spectrum</CardTitle>
              <EmpiricalSpectrum data={scienceSpectrum} color="#0ea5e9" interactable preview />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Match Beetwen Teorical And Empiricals Spectrums</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 items-center justify-center gap-4 md:grid-cols-2">
            <InferenceBoxGraph />
            <ErrorScatterGraph />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
