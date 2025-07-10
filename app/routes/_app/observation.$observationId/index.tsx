import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod/v4"
import { db } from "~/db"
import type { Breadcrumbs } from "../-components/AppBreadcrumbs"
import { getSpectrums } from "./-actions/get-spectrums"
import { ObservationMetadataForm } from "./-components/ObservationMetadataForm"
import { SpectrumsFeatures } from "./-components/SpectrumsFeatures"
import { SpectrumsList } from "./-components/SpectrumsList"

const getInitialValues = createServerFn()
  .validator(z.object({ observationId: z.string() }))
  .handler(async ({ data }) => {
    const observation = await db.query.observation.findFirst({
      where: (observation, { eq }) => eq(observation.id, data.observationId),
      columns: {
        OBJECT: true,
        "DATE-OBS": true,
        UT: true,
        "MAIN-ID": true,
        "TIME-OBS": true,
        ST: true,
        HA: true,
        RA: true,
        DEC: true,
        GAIN: true,
        RA2000: true,
        DEC2000: true,
        RA1950: true,
        DEC1950: true,
        EXPTIME: true,
        DETECTOR: true,
        IMAGETYP: true,
        SPTYPE: true,
        JD: true,
        EQUINOX: true,
        AIRMASS: true,
      },
      with: {
        plate: {
          columns: { id: true, "PLATE-N": true },
          with: {
            project: { columns: { id: true, name: true } },
          },
        },
      },
    })
    if (!observation) {
      throw new Error(`Observation with ID ${data.observationId} not found`)
    }
    return observation
  })

export const Route = createFileRoute("/_app/observation/$observationId/")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const initialValues = await getInitialValues({
      data: { observationId: params.observationId },
    })
    const initialSpectrums = await getSpectrums({
      data: { observationId: params.observationId },
    })
    return {
      breadcrumbs: [
        {
          title: initialValues.plate.project.name,
          link: {
            to: "/project/$projectId",
            params: { projectId: initialValues.plate.project.id },
          },
        },
        {
          title: `Plate ${initialValues.plate["PLATE-N"]}`,
          link: { to: "/plate/$plateId", params: { plateId: initialValues.plate.id } },
        },
        {
          title: `Observation ${initialValues["MAIN-ID"] || params.observationId}`,
          link: { to: "/plate/$plateId", params: { plateId: params.observationId } },
        },
      ] satisfies Breadcrumbs,
      initialValues,
      initialSpectrums,
    }
  },
})

function RouteComponent() {
  const { observationId } = Route.useParams()
  const { initialValues, initialSpectrums } = Route.useLoaderData()

  return (
    <div className="max-w-6xl mx-auto px-8">
      <ObservationMetadataForm observationId={observationId} defaultValues={initialValues} />
      <div className="h-8" />
      <SpectrumsList observationId={observationId} initialSpectrums={initialSpectrums} />
      <div className="h-8" />
      <SpectrumsFeatures observationId={observationId} spectrums={initialSpectrums} />a
    </div>
  )
}
