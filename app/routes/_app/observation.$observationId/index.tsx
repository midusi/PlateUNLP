import { createFileRoute } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { useState } from "react"
import { z } from "zod"
import { db } from "~/db"
import { fetchGrayscaleImage } from "~/lib/image"
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
        imageHeight: true,
        imageWidth: true,
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
          columns: { id: true, "PLATE-N": true, OBSERVAT: true },
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
    const { imageWidth, imageHeight, ...initialValues } = await getInitialValues({
      data: { observationId: params.observationId },
    })
    const spectrums = await getSpectrums({ data: { observationId: params.observationId } })
    const rawImage = await fetchGrayscaleImage({
      url: `/observation/${params.observationId}/image`,
      width: imageWidth,
      height: imageHeight,
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
      spectrums,
      rawImage,
    }
  },
})

function RouteComponent() {
  const { observationId } = Route.useParams()
  const { initialValues, spectrums, rawImage } = Route.useLoaderData()

  return (
    <div className="mx-auto w-full max-w-6xl px-8">
      <ObservationMetadataForm
        observationId={observationId}
        defaultValues={initialValues}
        OBSERVAT={initialValues.plate.OBSERVAT}
      />
      <div className="h-8" />
      <SpectrumsList observationId={observationId} initialSpectrums={spectrums} />
      <div className="h-8" />
      <SpectrumsFeatures observationId={observationId} rawImage={rawImage} spectrums={spectrums} />
    </div>
  )
}
