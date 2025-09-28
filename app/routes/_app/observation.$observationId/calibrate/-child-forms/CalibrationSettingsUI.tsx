import { useRouter } from "@tanstack/react-router"
import clsx from "clsx"
import { FilePlus } from "lucide-react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { withForm } from "~/hooks/use-app-form"
import { legendreAlgoritm, linearRegression, piecewiseLinearRegression } from "~/lib/utils"
import { LoadLampFileModal } from "../-components/LoadLampFileModal"
import { ReferenceLampRange } from "../-components/ReferenceLampRange"
import { ReferenceLampSpectrum } from "../-components/ReferenceLampSpectrum"
import type { InferenceOption } from "../-utils/updateInferenceFunctionInStore"

export const inferenceOptions: InferenceOption[] = [
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

export const CalibrationSettingsUI = withForm({
  /** Estos valores NO se usan en tiempo de ejecucion */
  defaultValues: {
    minWavelength: 0,
    maxWavelength: 2000,
    material: "Fe-Ne",
    onlyOneLine: true,
    inferenceFunction: "Linear regresion",
    deegre: 1,
    materialPoints: [{ x: 1, y: 2 }],
    lampPoints: [{ x: 1, y: 2 }],
  },
  props: {
    materialArr: [
      {
        wavelength: 1.0,
        material: "Fe",
        intensity: 1000,
      },
    ],
    materialsNamesList: ["Fe-Ne", "Fe-Ne-Ar"],
  },
  render: function Render({ form, materialArr, materialsNamesList }) {
    const [isLoadLampModalOpen, setIsLoadLampModalOpen] = useState(false)
    const router = useRouter()

    return (
      <>
        <div className="grid grid-cols-1 items-center justify-center gap-4 md:grid-cols-2 ">
          <div className="order-1 flex items-end md:order-none">
            <form.AppField name="material">
              {(field) => (
                <field.SelectFieldSimple
                  label="Material"
                  options={[...materialsNamesList].map((v) => ({
                    label: v,
                    value: v,
                  }))}
                  className="flex-1"
                />
              )}
            </form.AppField>
            <div>
              <Button
                type="button"
                className="w-full border-r-0 bg-white shadow-none hover:cursor-pointer hover:bg-white"
                onClick={() => setIsLoadLampModalOpen(true)}
              >
                <FilePlus className="h-4 w-4" />
              </Button>
              {isLoadLampModalOpen && (
                <form.AppField name="material">
                  {(field) => (
                    <LoadLampFileModal
                      onClose={async (newMaterial: string) => {
                        setIsLoadLampModalOpen(false)
                        field.handleChange(newMaterial)
                        await router.invalidate()
                      }}
                      actualLampsNamesList={materialsNamesList}
                    />
                  )}
                </form.AppField>
              )}
            </div>
          </div>
          <div className="order-3 md:order-none">
            <form.AppField name="inferenceFunction">
              {(field) => (
                <field.SelectFieldSimple
                  label="Inference Function For Fit"
                  options={inferenceOptions.map((v) => ({
                    label: v.name,
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
                      <field.NumberField
                        label="Deegre"
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
        <div className="grid w-full grid-cols-1 gap-4 overflow-hidden md:grid-cols-[1fr_130px] ">
          <div className="col-span-1 mt-10 py-2">
            <form.Field name="minWavelength">
              {(fieldMnW) => (
                <form.Field name="maxWavelength">
                  {(fieldMxW) => (
                    <form.Field name="onlyOneLine">
                      {(fieldOOL) => (
                        <ReferenceLampRange
                          material={form.getFieldValue("material")}
                          materialArr={materialArr}
                          onlyOneLine={fieldOOL.state.value}
                          minWavelength={fieldMnW.state.value}
                          setMinWavelength={(min) => {
                            fieldMnW.handleChange(min)
                          }}
                          maxWavelength={fieldMxW.state.value}
                          setMaxWavelength={(max) => {
                            fieldMxW.handleChange(max)
                          }}
                        />
                      )}
                    </form.Field>
                  )}
                </form.Field>
              )}
            </form.Field>
          </div>
          <div className="hidden md:flex md:flex-col md:justify-center md:gap-2">
            <div className="flex flex-col gap-2">
              <form.AppField name="minWavelength">
                {(field) => (
                  <div className="flex items-end gap-1">
                    {" "}
                    <field.NumberField
                      label="Min. wavelength"
                      hight_modifier="h-6"
                      decimals={2}
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
                  <div className="flex items-end gap-1">
                    {" "}
                    <field.NumberField
                      label="Max. wavelength"
                      hight_modifier="h-6"
                      decimals={2}
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
        <form.Field name="material">
          {(fieldMat) => (
            <form.Field name="onlyOneLine">
              {(fieldOOL) => (
                <form.Field name="minWavelength">
                  {(fieldMnW) => (
                    <form.Field name="maxWavelength">
                      {(fieldMxW) => (
                        <form.Field name="materialPoints">
                          {(fieldMP) => (
                            <ReferenceLampSpectrum
                              minWavelength={fieldMnW.state.value}
                              maxWavelength={fieldMxW.state.value}
                              material={fieldMat.state.value}
                              materialArr={materialArr}
                              onlyOneLine={fieldOOL.state.value}
                              materialPoints={fieldMP.state.value}
                              setMaterialPoints={(arr: { x: number; y: number }[]) => {
                                fieldMP.handleChange(arr)
                              }}
                            />
                          )}
                        </form.Field>
                      )}
                    </form.Field>
                  )}
                </form.Field>
              )}
            </form.Field>
          )}
        </form.Field>
      </>
    )
  },
})
