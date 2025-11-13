import { createFileRoute } from "@tanstack/react-router"
import { useRef, useState } from "react"
import type z from "zod"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import { useGlobalStore } from "~/hooks/use-global-store"
import { formatObservation } from "~/lib/format"
import { notifyError } from "~/lib/notifications"
import { CustomError } from "~/lib/utils"
import { getPlateName } from "~/routes/_app/plate.$plateId/-actions/get-plate-name"
import { getProjectName } from "~/routes/_app/project.$projectId/-actions/get-project-name"
import { TeoricalSpectrumConfigSchema } from "~/types/calibrate"
import type { Breadcrumbs } from "../../-components/AppBreadcrumbs"
import { getObservationMetadata } from "../-actions/get-observation-metadata"
import { getMaterialData } from "./-actions/get-material-data"
import { getMaterialsNames } from "./-actions/get-materials-names"
import { getOrAddCalibration } from "./-actions/get-or-add-calibration"
import { getSpectrums } from "./-actions/get-spectrums"
import { updateCalibration } from "./-actions/update-calibration"
import { CalibrationSettingsUI, inferenceOptions } from "./-child-forms/CalibrationSettingsUI"
import { EmpiricalSpectrum } from "./-components/EmpiricalSpectrum"
import { ErrorScatterGraph } from "./-components/ErrorScatterGraph"
import { InferenceBoxGraph } from "./-components/InferenceBoxGraph"
import { downloadJSON } from "./-utils/download-json"
import { updateInferenceFuntionInStore } from "./-utils/updateInferenceFunctionInStore"

export const Route = createFileRoute("/_app/observation/$observationId/calibrate/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const [project, plate, initialMetadata, spectrums, calibration, listOfMaterials] =
      await Promise.all([
        getProjectName({
          data: { from: "observation", id: params.observationId },
        }),
        getPlateName({
          data: { from: "observation", id: params.observationId },
        }),
        getObservationMetadata({
          data: { observationId: params.observationId },
        }),
        getSpectrums({ data: { observationId: params.observationId } }),
        getOrAddCalibration({ data: { observationId: params.observationId } }),
        getMaterialsNames(),
      ])

    const materialData = await getMaterialData({
      data: { materialName: calibration.material },
    })

    const observationIdentifier = `${initialMetadata.OBJECT}.${initialMetadata["DATE-OBS"].value}.${initialMetadata.UT.value}`

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
          title: formatObservation({ ...initialMetadata, id: params.observationId }),
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
      plateN: plate["PLATE-N"],
      observationIdentifier: observationIdentifier,
      spectrums: spectrums as typeof spectrums,
      calibration: calibration,
      materialData: materialData,
      listOfMaterials: listOfMaterials,
    }
  },
})

function RouteComponent() {
  const { spectrums, calibration, materialData, listOfMaterials, plateN, observationIdentifier } =
    Route.useLoaderData()

  const lastMaterial = useRef<string>(calibration.material)
  const [materialArr, setMaterialArr] = useState<
    { wavelength: number; material: string; intensity: number }[]
  >(materialData?.arr ?? [])

  const [pixelToWavelengthFunction, setPixelToWavelengthFunction] = useGlobalStore((s) => [
    s.pixelToWavelengthFunction,
    s.setPixelToWavelengthFunction,
  ])

  const scienceSpectrum =
    spectrums
      .find((s) => s.type === "science")
      ?.intensityArr.map((n, idx) => ({
        pixel: idx,
        intensity: n,
      })) ?? []

  const lamps = spectrums
    .filter((s) => s.type !== "science")
    .map((s, idx) => ({
      id: idx,
      data: s.intensityArr.map((n, idx) => ({
        pixel: idx,
        intensity: n,
      })),
    }))

  const defaultValues: z.output<typeof TeoricalSpectrumConfigSchema> = {
    minWavelength: calibration.minWavelength,
    maxWavelength: calibration.maxWavelength,
    material: calibration.material,
    onlyOneLine: calibration.onlyOneLine,
    inferenceFunction: calibration.inferenceFunction,
    deegre: calibration.deegre,
    materialPoints: calibration.materialPoints,
    lampPoints: calibration.lampPoints,
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: TeoricalSpectrumConfigSchema, onMount: TeoricalSpectrumConfigSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        if (formApi.state.isValid) {
          await updateCalibration({
            data: {
              id: calibration.id,
              minWavelength: value.minWavelength,
              maxWavelength: value.maxWavelength,
              material: value.material,
              inferenceFunction: value.inferenceFunction as
                | "Linear regresion"
                | "Piece wise linear regression"
                | "Legendre",
              onlyOneLine: value.onlyOneLine,
              deegre: value.deegre,
              materialPoints: value.materialPoints,
              lampPoints: value.lampPoints,
            },
          })

          /** Si el material cambio entonces hay que pedir los datos del nuevo material */
          if (lastMaterial.current !== value.material) {
            const materialData = await getMaterialData({
              data: { materialName: value.material },
            })
            setMaterialArr(materialData?.arr ?? [])
            lastMaterial.current = value.material
          }

          const selectedFuntionOption = inferenceOptions.find(
            (f) => f.name === value.inferenceFunction,
          )!
          updateInferenceFuntionInStore(
            selectedFuntionOption,
            value.deegre,
            value.lampPoints,
            value.materialPoints,
            setPixelToWavelengthFunction,
          )
        }

        /**
         * Activar esto proboca que los formularios se reseteen continuamient
         * con valores incorrectos por mas de que la db este ok
         */
        //formApi.reset(value)
      } catch (error) {
        notifyError("Failed to update calibration settings", error)
      }
    },
    listeners: {
      onChange: async ({ formApi }) => {
        // autosave logic
        if (formApi.state.isValid) {
          formApi.handleSubmit()
        }
      },
      onMount: async ({ formApi }) => {
        // autosave logic
        if (formApi.state.isValid) {
          formApi.handleSubmit()
        }
      },
      onChangeDebounceMs: 500,
    },
  })

  return (
    <>
      <Card className="mx-auto w-full px-8">
        <CardContent>
          <CardTitle className="mb-4">Teorical Comparison Lamp</CardTitle>
          <CalibrationSettingsUI
            form={form}
            materialArr={materialArr}
            materialsNamesList={listOfMaterials}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <form.Subscribe
            selector={(formState) => [formState.isValid, formState.isSubmitting, formState.isDirty]}
          >
            {([isValid, isSubmitting, _isDirty]) => (
              <p className="flex items-center text-muted-foreground text-xs italic">
                {!isValid ? (
                  <>
                    <span>Changes aren't beign saved! Please fix the errors above</span>
                    <span className="icon-[ph--warning-circle-bold] ml-1 size-3" />
                  </>
                ) : isSubmitting ? (
                  <>
                    <span>Saving changes...</span>
                    <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Settings saved on database</span>
                    <span className="icon-[ph--cloud-arrow-up-bold] ml-1 size-3" />
                  </>
                )}
              </p>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
      <Card>
        <CardContent>
          {/* Grafico de interacción para calibrar respecto a lampara teorica */}
          <form.Field name="lampPoints">
            {(fieldLP) => (
              <div className="flex flex-col px-8">
                {/* Grafico espectro calibrado para cada lampara */}
                {lamps.map((lamp, idx) => (
                  <div key={`TeoricalSpectrumLamp-${lamp.id}`}>
                    <CardTitle className="mb-4">Empirical Comparison Lamp {idx}</CardTitle>
                    <EmpiricalSpectrum
                      data={lamp.data}
                      lampPoints={fieldLP.state.value}
                      setLampPoints={(arr: { x: number; y: number }[]) => fieldLP.handleChange(arr)}
                      pixelToWavelengthFunction={pixelToWavelengthFunction}
                    />
                  </div>
                ))}

                {/* Grafico espectro calibrado ciencia */}
                <div>
                  <CardTitle className="mb-4">Empirical Science Spectrum</CardTitle>
                  <EmpiricalSpectrum
                    data={scienceSpectrum}
                    lampPoints={fieldLP.state.value}
                    setLampPoints={(arr: { x: number; y: number }[]) => fieldLP.handleChange(arr)}
                    pixelToWavelengthFunction={pixelToWavelengthFunction}
                  />
                </div>
              </div>
            )}
          </form.Field>
        </CardContent>
        <CardFooter className="flex justify-end">
          <form.Subscribe
            selector={(formState) => [formState.isValid, formState.isSubmitting, formState.isDirty]}
          >
            {([isValid, isSubmitting, isDirty]) => (
              <p className="flex items-center text-muted-foreground text-xs italic">
                {!isValid ? (
                  <>
                    <span>Changes aren't beign saved! Please fix the errors above</span>
                    <span className="icon-[ph--warning-circle-bold] ml-1 size-3" />
                  </>
                ) : isSubmitting || isDirty ? (
                  <>
                    <span>Saving changes...</span>
                    <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Settings saved on database</span>
                    <span className="icon-[ph--cloud-arrow-up-bold] ml-1 size-3" />
                  </>
                )}
              </p>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="px-8">Inference analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <form.Field name="lampPoints">
            {(fieldLP) => (
              <form.Field name="materialPoints">
                {(fieldMP) => (
                  <div className="grid grid-cols-1 items-center justify-center gap-4 px-8 md:grid-cols-2">
                    <div>
                      <h2 className="text-center font-bold text-lg">Xpixel Vs Wavelength</h2>

                      <InferenceBoxGraph
                        pixelToWavelengthFunction={pixelToWavelengthFunction}
                        lampPoints={fieldLP.state.value}
                        materialPoints={fieldMP.state.value}
                      />
                    </div>
                    <div>
                      <h2 className="text-center font-bold text-lg">Graph of dispersion error</h2>
                      <ErrorScatterGraph
                        pixelToWavelengthFunction={pixelToWavelengthFunction}
                        lampPoints={fieldLP.state.value}
                        materialPoints={fieldMP.state.value}
                      />
                    </div>
                  </div>
                )}
              </form.Field>
            )}
          </form.Field>
        </CardContent>
      </Card>

      <form.Subscribe
        selector={(formState) => [formState.isValid, formState.isSubmitting, formState.isDirty]}
      >
        {([isValid, isSubmitting, isDirty]) => (
          <div className="flex w-full justify-center">
            <Button
              onClick={() => {
                if (pixelToWavelengthFunction instanceof CustomError) return
                const jsonToDownload = {
                  science: scienceSpectrum.map((item) => ({
                    wavelength: pixelToWavelengthFunction(item.pixel),
                    intensity: item.intensity,
                  })),
                }
                downloadJSON(jsonToDownload, `${plateN}.${observationIdentifier}.science.json`)
              }}
              disabled={
                !isValid || isSubmitting || pixelToWavelengthFunction instanceof CustomError
              }
              className="m-4 flex w-20 justify-center"
            >
              Export
            </Button>
          </div>
        )}
      </form.Subscribe>
    </>
  )
}
