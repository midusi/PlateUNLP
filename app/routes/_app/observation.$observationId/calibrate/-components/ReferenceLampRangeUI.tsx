import clsx from "clsx"
import { useEffect, useId, useMemo } from "react"
import type z from "zod"
import { Input } from "~/components/atoms/input"
import { Label } from "~/components/atoms/label"
import { ReferenceLampRange } from "~/components/molecules/ReferenceLampRange"
import { useAppForm } from "~/hooks/use-app-form"
import { useGlobalStore } from "~/hooks/use-global-store"
import { LAMP_MATERIALS } from "~/lib/spectral-data"
import {
  CustomError,
  legendreAlgoritm,
  linearRegression,
  piecewiseLinearRegression,
} from "~/lib/utils"
import { TeoricalSpectrumConfigSchema } from "~/types/calibrate"

type FindFitFunction = (x: number[], y: number[], degree?: number) => (value: number) => number
interface InferenceOption {
  id: number
  name: string
  funct: FindFitFunction
  needDegree: boolean
}

const inferenceOptions: InferenceOption[] = [
  {
    id: 0,
    name: "Linear regresion",
    funct: linearRegression,
    needDegree: false,
  },
  {
    id: 1,
    name: "Piece wise linear regression",
    funct: piecewiseLinearRegression,
    needDegree: false,
  },
  {
    id: 2,
    name: "Legendre",
    funct: legendreAlgoritm,
    needDegree: true,
  },
]

export function ReferenceLampRangeUI() {
  const [
    rangeMin,
    setRangeMin,
    setRangeMax,
    rangeMax,
    material,
    setMaterial,
    oneTeoricalSpectrum,
    setOneTeoricalSpectrum,
    setPixelToWavelengthFunction,
    lampPoints,
    materialPoints,
  ] = useGlobalStore((s) => [
    s.rangeMin,
    s.setRangeMin,
    s.setRangeMax,
    s.rangeMax,
    s.material,
    s.setMaterial,
    s.oneTeoricalSpectrum,
    s.setOneTeoricalSpectrum,
    s.setPixelToWavelengthFunction,
    s.lampPoints,
    s.materialPoints,
  ])

  const [matches] = useMemo(() => {
    const matches = []
    const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
    for (let i = 0; i < smallArr.length; i++) {
      matches.push({ lamp: lampPoints[i], material: materialPoints[i] })
    }

    return [matches]
  }, [lampPoints, materialPoints])

  const defaultValues: z.output<typeof TeoricalSpectrumConfigSchema> = {
    minWavelength: rangeMin,
    maxWavelength: rangeMax,
    material: material,
    onlyOneLine: oneTeoricalSpectrum,
    inferenceFunction: inferenceOptions[0].name,
    deegre: 1,
  }
  const form = useAppForm({
    defaultValues,
    validators: { onChange: TeoricalSpectrumConfigSchema },
    listeners: {
      onChange: ({ formApi }) => {
        if (formApi.state.isValid) {
          setRangeMin(formApi.state.values.minWavelength)
          setRangeMax(formApi.state.values.maxWavelength)
          setMaterial(formApi.state.values.material as "He-Ne-Ar" | "Fe-Ne-Ar" | "Fe-Ne")
          setOneTeoricalSpectrum(formApi.state.values.onlyOneLine)

          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const selectedFuntionOption = inferenceOptions.find(
            (f) => f.name === formApi.state.values.inferenceFunction,
          )!
          try {
            const inferenceFunction = selectedFuntionOption.funct(
              matches.map((val) => val.lamp.x),
              matches.map((val) => val.material.x),
              selectedFuntionOption.needDegree ? formApi.state.values.deegre : undefined,
            )
            setPixelToWavelengthFunction(inferenceFunction)
          } catch (error) {
            if (error instanceof CustomError) {
              setPixelToWavelengthFunction(error)
            } else {
              throw error
            }
          }
          //formApi.handleSubmit(); // Autosave, ejjecuta onSubmit
        }
      },
      onChangeDebounceMs: 500,
    },
  })

  /** Temporal hasta refactorizar toda la seccion de calibracion */
  useEffect(() => {
    form.setFieldValue("minWavelength", rangeMin)
    form.setFieldValue("maxWavelength", rangeMax)
  }, [rangeMin, rangeMax, form.setFieldValue])

  return (
    <>
      <div className="grid grid-cols-1 items-center justify-center gap-4 md:grid-cols-2 ">
        <div className="order-1 md:order-none">
          <form.AppField name="material">
            {(field) => (
              <field.SelectField
                label="Material"
                options={[...LAMP_MATERIALS].map((v) => ({
                  name: v,
                  value: v,
                }))}
              />
            )}
          </form.AppField>
        </div>
        <div className="order-3 md:order-none">
          <form.AppField name="inferenceFunction">
            {(field) => (
              <field.SelectField
                label="Inference Function For Fit"
                options={inferenceOptions.map((v) => ({
                  name: v.name,
                  value: v.name,
                }))}
              />
            )}
          </form.AppField>
        </div>
        <div className="order-2 md:order-none">
          <form.AppField name="onlyOneLine">
            {(field) => <field.CheckboxField label="ShowOneLine" />}
          </form.AppField>
        </div>
        <div className="order-4 md:order-none">
          <form.Subscribe selector={(state) => state.values.inferenceFunction}>
            {(inferenceFunction) => {
              const option = inferenceOptions.find((f) => f.name === inferenceFunction)
              const showDegre = option?.needDegree ?? false
              return (
                <form.AppField name="deegre">
                  {(field) => (
                    <field.TextField
                      label="Deegre"
                      type="number"
                      className={clsx("text-sm tabular-nums", "disabled:cursor-default ")}
                      disabled={!showDegre}
                    />
                  )}
                </form.AppField>
              )
            }}
          </form.Subscribe>
        </div>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 overflow-hidden md:grid-cols-[1fr_200px] ">
        <div className="col-span-1">
          <ReferenceLampRange />
        </div>
        <div className="hidden md:flex md:flex-col md:justify-center md:gap-2">
          <div className="flex flex-col gap-2">
            <form.AppField name="minWavelength">
              {(field) => (
                <div className="flex items-center gap-1">
                  {" "}
                  <field.TextField
                    label="Min. wavelength"
                    type="number"
                    hight_modifier="h-6"
                    className={clsx(
                      "text-sm tabular-nums",
                      "disabled:cursor-default disabled:opacity-100",
                    )}
                  />
                  <span className="text-gray-500">Å</span>
                </div>
              )}
            </form.AppField>
          </div>
          <div className="flex flex-col gap-2">
            <form.AppField name="maxWavelength">
              {(field) => (
                <div className="flex items-center gap-1">
                  {" "}
                  <field.TextField
                    label="Max. wavelength"
                    type="number"
                    hight_modifier="h-6"
                    className={clsx(
                      "text-sm tabular-nums",
                      "disabled:cursor-default disabled:opacity-100",
                    )}
                  />
                  <span className="text-gray-500">Å</span>
                </div>
              )}
            </form.AppField>
          </div>
        </div>
      </div>
    </>
  )
}
