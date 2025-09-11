import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { fetchGrayscaleImage } from "~/lib/image"
import { linearRegression } from "~/lib/utils"
import { getPlateName } from "~/routes/_app/plate.$plateId/-actions/get-plate-name"
import { getProjectName } from "~/routes/_app/project.$projectId/-actions/get-project-name"
import type { Breadcrumbs } from "../../-components/AppBreadcrumbs"
import { getObservationMetadata } from "../-actions/get-observation-metadata"
import { getSpectrums } from "./-actions/get-spectrums"
import { EmpiricalSpectrum } from "./-components/EmpiricalSpectrum"
import { ErrorScatterGraph } from "./-components/ErrorScatterGraph"
import { InferenceBoxGraph } from "./-components/InferenceBoxGraph"
import { ReferenceLampRangeUI } from "./-components/ReferenceLampRangeUI"
import { ReferenceLampSpectrum } from "./-components/ReferenceLampSpectrum"

export const Route = createFileRoute("/_app/observation/$observationId/calibrate/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const [project, plate, initialMetadata, spectrums] = await Promise.all([
      getProjectName({
        data: { from: "observation", id: params.observationId },
      }),
      getPlateName({ data: { from: "observation", id: params.observationId } }),
      getObservationMetadata({ data: { observationId: params.observationId } }),
      getSpectrums({ data: { observationId: params.observationId } }),
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
          title: `${initialMetadata.OBJECT}/${initialMetadata["DATE-OBS"].value}/${initialMetadata.UT.value}`,
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
      spectrums: spectrums as typeof spectrums,
    }
  },
})

function RouteComponent() {
  const { spectrums } = Route.useLoaderData()

  const scienceSpectrum =
    spectrums
      .find((s) => s.type === "science")
      ?.intensityArr.map((n, idx) => ({
        pixel: idx,
        intensity: n,
      })) ?? []

  const lamps = spectrums
    .filter((s) => s.type !== "science")
    .map((s) =>
      s.intensityArr.map((n, idx) => ({
        pixel: idx,
        intensity: n,
      })),
    )
  const lamp2Spectrum = lamps[0]
  const lamp1Spectrum = lamps[1]

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
