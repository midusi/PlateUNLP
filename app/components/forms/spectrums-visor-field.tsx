import { useStore } from "@tanstack/react-form"
import clsx from "clsx"
import type z from "zod"
import { Field, FieldDescription, FieldError } from "~/components/ui/field"
import type { Input } from "~/components/ui/input"
import { useFieldContext } from "~/hooks/use-app-form-context"
import type { SpectrumSchema } from "~/types/spectrum-metadata"
import { ImageWithPixelExtraction } from "../ImageWithPixelExtraction"
import { SimpleFunctionXY } from "../SimpleFunctionXY"

type SpectrumsVisorFieldProps = {
  observationId: string
  changeType: (spectrum: string, type: "lamp" | "science") => void
  description?: React.ReactNode
  className?: string
  analysis?: {
    intensityArr: number[]
    mediasPoints: {
      x: number
      y: number
    }[]
    rectFunction: (x: number) => number
    opening: number
  }
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

export function SpectrumsVisorField({
  observationId,
  description,
  className,
  changeType,
  analysis,
}: SpectrumsVisorFieldProps) {
  const field = useFieldContext<z.infer<typeof SpectrumSchema>[]>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  const spectrums = field.state.value
  const scienceCount = spectrums.filter((s) => s.type === "science").length

  console.log("visor", analysis)

  return (
    <Field className={className}>
      {spectrums.length === 0 ? (
        <span>Waiting definition of spectrums</span>
      ) : (
        spectrums.map((sd, i) => {
          return (
            <div key={`Spectrum Analysis ${sd.id}`}>
              <div className="flex w-full flex-row items-center justify-center gap-2 font-semibold text-lg text-slate-500">
                <h3 className="flex justify-center ">{`Spectrum ${i} [`}</h3>
                <select
                  value={sd.type}
                  name="type-of-spectrums"
                  id="type-of-spectrums"
                  className="rounded-lg bg-gray-100"
                  style={{
                    textAlign: "center",
                    textAlignLast: "center",
                  }}
                  onChange={(e) => {
                    const selectedValue = e.target.value as "lamp" | "science"
                    if (sd.type === selectedValue) return

                    changeType(sd.id, selectedValue)
                  }}
                >
                  <option value={"science"}>Science</option>
                  <option
                    value={"lamp"}
                    disabled={scienceCount === 1 && sd.type === "science"}
                    className="disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    Comparison Lamp
                  </option>
                </select>
                <h3 className="flex justify-center ">{`]`}</h3>
              </div>
              {analysis ? (
                <>
                  <ImageWithPixelExtraction
                    image={{
                      url: `/observation/${observationId}/preview`,
                      width: sd.imageWidth,
                      height: sd.imageHeight,
                      top: sd.imageTop,
                      left: sd.imageLeft,
                    }}
                    pointsWMed={analysis.mediasPoints}
                    drawFunction={analysis.rectFunction as (value: number) => number}
                    opening={analysis.opening}
                  />
                  <SimpleFunctionXY data={analysis.intensityArr} />
                </>
              ) : (
                <span
                  className={clsx(
                    "mx-10 my-4 flex items-center justify-center p-4",
                    "icon-[ph--spinner-bold] animate-spin",
                  )}
                />
              )}
            </div>
          )
        })
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
