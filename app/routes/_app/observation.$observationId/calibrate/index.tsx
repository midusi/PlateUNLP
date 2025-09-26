import { createFileRoute, useRouter } from "@tanstack/react-router"
import { ca } from "date-fns/locale"
import { material } from "db/schema/material"
import { useEffect, useRef, useState } from "react"
import type z from "zod"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import { useGlobalStore } from "~/hooks/use-global-store"
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
      calibration: calibration,
      materialData: materialData,
      listOfMaterials: listOfMaterials,
    }
  },
})

function RouteComponent() {
  const { spectrums, calibration, materialData, listOfMaterials } = Route.useLoaderData()

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
    .map((s) =>
      s.intensityArr.map((n, idx) => ({
        pixel: idx,
        intensity: n,
      })),
    )
  const lamp2Spectrum = lamps[0]
  const lamp1Spectrum = lamps[1]

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
  const router = useRouter()
  const form = useAppForm({
    defaultValues,
    validators: { onChange: TeoricalSpectrumConfigSchema },
    listeners: {
      onChange: async ({ formApi }) => {
        if (formApi.state.isValid) {
          await updateCalibration({
            data: {
              id: calibration.id,
              minWavelength: formApi.state.values.minWavelength,
              maxWavelength: formApi.state.values.maxWavelength,
              material: formApi.state.values.material,
              inferenceFunction: formApi.state.values.inferenceFunction as
                | "Linear regresion"
                | "Piece wise linear regression"
                | "Legendre",
              onlyOneLine: formApi.state.values.onlyOneLine,
              deegre: formApi.state.values.deegre,
              materialPoints: formApi.state.values.materialPoints,
              lampPoints: formApi.state.values.lampPoints,
            },
          })

          /** Si el material cambio entonces hay que pedir los datos del nuevo material */
          if (lastMaterial.current !== formApi.state.values.material) {
            const materialData = await getMaterialData({
              data: { materialName: formApi.state.values.material },
            })
            setMaterialArr(materialData?.arr ?? [])
            lastMaterial.current = formApi.state.values.material
          }

          const inferenceFunction = formApi.state.values.inferenceFunction
          const deegre = formApi.state.values.deegre
          const materialPoints = formApi.state.values.materialPoints
          const lampPoints = formApi.state.values.lampPoints
          const selectedFuntionOption = inferenceOptions.find((f) => f.name === inferenceFunction)!
          updateInferenceFuntionInStore(
            selectedFuntionOption,
            deegre,
            lampPoints,
            materialPoints,
            setPixelToWavelengthFunction,
          )

          //formApi.handleSubmit(); // Autosave, ejjecuta onSubmit
        }
      },
      onChangeDebounceMs: 500,
    },
  })

  /** Temporal hasta refactorizar toda la seccion de calibracion */
  useEffect(() => {
    const inferenceFunction = form.getFieldValue("inferenceFunction")
    const deegre = form.getFieldValue("deegre")
    const materialPoints = form.getFieldValue("materialPoints")
    const lampPoints = form.getFieldValue("lampPoints")
    const selectedFuntionOption = inferenceOptions.find((f) => f.name === inferenceFunction)!

    updateInferenceFuntionInStore(
      selectedFuntionOption,
      deegre,
      lampPoints,
      materialPoints,
      setPixelToWavelengthFunction,
    )
  }, [form.getFieldValue, setPixelToWavelengthFunction])

  return (
    <>
      <Card className="mx-auto w-full max-w-6xl px-8">
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
        <CardContent>
          {/* Grafico de interacción para calibrar respecto a lampara teorica */}
          <form.Field name="lampPoints">
            {(fieldLP) => (
              <form.Field name="materialPoints">
                {(fieldMP) => (
                  <div className="flex flex-col px-8">
                    {/* Grafico espectro calibrado lampara 1 */}
                    <div>
                      <CardTitle className="mb-4">Empirical Comparison Lamp 1</CardTitle>
                      <EmpiricalSpectrum
                        data={lamp1Spectrum}
                        color="#0ea5e9"
                        interactable
                        preview
                        lampPoints={fieldLP.state.value}
                        setLampPoints={(arr: { x: number; y: number }[]) =>
                          fieldLP.handleChange(arr)
                        }
                        materialPoints={fieldMP.state.value}
                      />
                    </div>

                    {/* Grafico espectro calibrado lampara 2 */}
                    <div>
                      <CardTitle className="mb-4">Empirical Comparison Lamp 2</CardTitle>
                      <EmpiricalSpectrum
                        data={lamp2Spectrum}
                        color="#0ea5e9"
                        interactable
                        preview
                        lampPoints={fieldLP.state.value}
                        setLampPoints={(arr: { x: number; y: number }[]) =>
                          fieldLP.handleChange(arr)
                        }
                        materialPoints={fieldMP.state.value}
                      />
                    </div>

                    {/* Grafico espectro calibrado ciencia */}
                    <div>
                      <CardTitle className="mb-4">Empirical Science Spectrum</CardTitle>
                      <EmpiricalSpectrum
                        data={scienceSpectrum}
                        color="#0ea5e9"
                        interactable
                        preview
                        lampPoints={fieldLP.state.value}
                        setLampPoints={(arr: { x: number; y: number }[]) =>
                          fieldLP.handleChange(arr)
                        }
                        materialPoints={fieldMP.state.value}
                      />
                    </div>
                  </div>
                )}
              </form.Field>
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
    </>
  )
}
