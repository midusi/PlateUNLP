import type z from "zod"
import { ImageWithPixelExtraction } from "~/components/ImageWithPixelExtraction"
import { SimpleFunctionXY } from "~/components/SimpleFunctionXY"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { withForm } from "~/hooks/use-app-form"
import { useXViewport } from "~/hooks/use-x-viewport"
import type { ExtractSpectrumResponse } from "~/lib/extract-features"
import { cn } from "~/lib/utils"
import {
  type ExtractionConfigurationSchema,
  FIT_DEGREE_MAX,
  FIT_DEGREE_MIN,
} from "~/types/spectrum-metadata"
import { type SpectrumType, setSpectrumType } from "../-utils/set-spectrum-type"

const TYPE_OPTIONS: { value: SpectrumType; label: string }[] = [
  { value: "science", label: "Science" },
  { value: "lamp", label: "Comparison Lamp" },
]

/**
 * Tarjeta de un espectro: menu de configuracion en una sola linea, recorte con
 * traza y apertura, y grafico 1D. Imagen y grafico comparten el rango de
 * columnas visibles, asi que acercarse o desplazarse en uno lo hace en el otro.
 */
export const SpectrumCard = withForm({
  /** Estos valores NO se usan en tiempo de ejecucion */
  defaultValues: { spectrums: [] } as z.output<typeof ExtractionConfigurationSchema>,
  props: {
    /** Posicion del espectro en el arreglo `spectrums` del formulario. */
    index: 0,
    observationId: "",
    spectrum: { id: "", imageWidth: 1, imageHeight: 1, imageTop: 0, imageLeft: 0 },
    analysis: {
      mediasPoints: [],
      opening: 0,
      rectFunction: (x: number) => x,
      transversalAvgs: [],
    } as Pick<
      ExtractSpectrumResponse,
      "mediasPoints" | "opening" | "rectFunction" | "transversalAvgs"
    >,
    type: "science" as SpectrumType,
    /** Cantidad de espectros de ciencia, para no dejar la observacion sin ninguno. */
    scienceCount: 1,
    /** Hay un recalculo en curso: se muestra el resultado anterior, atenuado. */
    isCalculating: false,
  },
  render: function Render({
    form,
    index,
    observationId,
    spectrum,
    analysis,
    type,
    scienceCount,
    isCalculating,
  }) {
    /** Una columna por valor del grafico 1D (el recorte se hace con el ancho truncado). */
    const xViewport = useXViewport(analysis.transversalAvgs.length)

    return (
      <Card className="gap-0 overflow-hidden py-0" aria-busy={isCalculating}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-olive-300 border-b px-4 py-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-semibold text-lg text-slate-500">Spectrum {index}</h3>
            <Select
              items={TYPE_OPTIONS}
              value={type}
              onValueChange={(value) => {
                if (value === null || value === type) return
                form.setFieldValue("spectrums", (spectrums) =>
                  setSpectrumType(spectrums, spectrum.id, value),
                )
              }}
            >
              <SelectTrigger size="sm" aria-label="Spectrum type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(({ value, label }) => (
                  <SelectItem
                    key={value}
                    value={value}
                    disabled={value === "lamp" && type === "science" && scienceCount <= 1}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <form.AppField name={`spectrums[${index}].fitDegree`}>
            {(field) => (
              <field.StepperField
                className="shrink-0"
                label="Degree"
                min={FIT_DEGREE_MIN}
                max={FIT_DEGREE_MAX}
                step={1}
              />
            )}
          </form.AppField>

          <form.AppField name={`spectrums[${index}].apertureCoefficient`}>
            {(field) => (
              <field.RangeField
                className="min-w-36 flex-1"
                label="Aperture"
                min={0.5}
                max={1.5}
                step={0.1}
              />
            )}
          </form.AppField>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reset zoom"
              title="Reset zoom"
              disabled={!xViewport.isZoomed}
              onClick={xViewport.reset}
            >
              <span className="icon-[ph--arrow-counter-clockwise]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Download FITS"
              title="Download FITS"
              render={
                <a href={`/spectrum/${spectrum.id}/fits`}>
                  <span className="icon-[ph--file-arrow-down]" />
                </a>
              }
            />
          </div>
        </div>

        <div className={cn("transition-opacity", isCalculating && "opacity-60")}>
          <ImageWithPixelExtraction
            image={{
              url: `/api/observation/${observationId}/preview`,
              width: spectrum.imageWidth,
              height: spectrum.imageHeight,
              top: spectrum.imageTop,
              left: spectrum.imageLeft,
            }}
            pointsWMed={analysis.mediasPoints}
            drawFunction={analysis.rectFunction}
            opening={analysis.opening}
            xViewport={xViewport}
          />
          <SimpleFunctionXY data={analysis.transversalAvgs} xViewport={xViewport} />
        </div>
      </Card>
    )
  },
})
