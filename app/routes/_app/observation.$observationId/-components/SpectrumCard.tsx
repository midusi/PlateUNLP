import { useMemo, useState } from "react"
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
import type { XViewportController } from "~/hooks/use-x-viewport"
import type { ExtractSpectrumResponse } from "~/lib/extract-features"
import { cn } from "~/lib/utils"
import {
  type ExtractionConfigurationSchema,
  FIT_DEGREE_MAX,
  FIT_DEGREE_MIN,
} from "~/types/spectrum-metadata"
import { buildGeometryMask } from "~/lib/oriented-box"
import { buildAppliedMaskOverlay, type MaskSource } from "../-utils/build-applied-mask-overlay"
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
    spectrum: {
      id: "",
      imageWidth: 1,
      imageHeight: 1,
      imageTop: 0,
      imageLeft: 0,
      imageAngle: 0 as number | null,
    },
    analysis: {
      mediasPoints: [],
      opening: 0,
      rectFunction: (x: number) => x,
      derivedFunction: () => 1,
      transversalAvgs: [],
    } as Pick<
      ExtractSpectrumResponse,
      "mediasPoints" | "opening" | "rectFunction" | "derivedFunction" | "transversalAvgs"
    >,
    type: "science" as SpectrumType,
    /** Cantidad de espectros de ciencia, para no dejar la observacion sin ninguno. */
    scienceCount: 1,
    /** Hay un recalculo en curso: se muestra el resultado anterior, atenuado. */
    isCalculating: false,
    /** Mascaras de los espectros extraidos antes que este, que tapan parte de su recorte. */
    maskSources: [] as MaskSource[],
    /** Rango de columnas visibles, compartido por todas las tarjetas del extractor. */
    xViewport: {} as XViewportController,
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
    maskSources,
    xViewport,
  }) {
    /** Dibuja las normales sobre las que se promedia cada columna. Solo de diagnostico. */
    const [showNormals, setShowNormals] = useState(false)
    /**
     * Muestra la imagen como la vio el extractor: con lo que taparon las mascaras de otros
     * espectros y lo que cae fuera de la caja del espectro, en negro.
     */
    const [showMasks, setShowMasks] = useState(false)
    /**
     * Vista enderezada de la caja del espectro (por defecto) o el recorte tal como lo ve la
     * extraccion: el rectangulo sin rotar, con todo en negro menos lo que esta dentro de la caja.
     */
    const [levelBox, setLevelBox] = useState(true)
    const isTilted = (spectrum.imageAngle ?? 0) !== 0
    /** Pixeles dentro de la caja inclinada del espectro; el resto lo ve la extraccion en negro. */
    const boxMask = useMemo(() => buildGeometryMask(spectrum), [spectrum])
    /** Enderezada, el exterior de la caja queda fuera de la vista: solo se ve en el recorte sin rotar. */
    const outsideBox = levelBox ? null : boxMask
    const maskOverlay = useMemo(
      () => (showMasks ? buildAppliedMaskOverlay(spectrum, maskSources, outsideBox) : null),
      [showMasks, spectrum, maskSources, outsideBox],
    )

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

          {/* Las lamparas reusan la traza del espectro de ciencia: su grado no cuenta. */}
          {type === "science" && (
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
          )}

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
              variant={showNormals ? "secondary" : "ghost"}
              size="icon"
              aria-label="Show normals"
              aria-pressed={showNormals}
              title="Show the perpendiculars the aperture is averaged along"
              onClick={() => setShowNormals((shown) => !shown)}
            >
              <span className="icon-[ph--ruler]" />
            </Button>
            <Button
              variant={isTilted && levelBox ? "secondary" : "ghost"}
              size="icon"
              aria-label="Level the box"
              aria-pressed={isTilted && levelBox}
              title={
                levelBox
                  ? "Showing the spectrum box levelled. Click to see the crop as the extractor sees it (not rotated)"
                  : "Showing the crop as the extractor sees it (not rotated, black outside the box). Click to level the spectrum box"
              }
              disabled={!isTilted}
              onClick={() => setLevelBox((level) => !level)}
            >
              <span className="icon-[ph--perspective]" />
            </Button>
            <Button
              variant={showMasks ? "secondary" : "ghost"}
              size="icon"
              aria-label="Show masks"
              aria-pressed={showMasks}
              title="Show the image as the extractor saw it, with the regions masked by earlier spectra and what is outside the spectrum box blanked"
              disabled={maskSources.length === 0 && !outsideBox}
              onClick={() => setShowMasks((shown) => !shown)}
            >
              <span className="icon-[ph--mask-happy]" />
            </Button>
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
              // Nivelada: con negro fuera de la observacion. Sin nivelar: el recorte crudo.
              url:
                isTilted && !levelBox
                  ? `/api/observation/${observationId}/preview?raw=1`
                  : `/api/observation/${observationId}/preview`,
              width: spectrum.imageWidth,
              height: spectrum.imageHeight,
              top: spectrum.imageTop,
              left: spectrum.imageLeft,
              angle: levelBox ? spectrum.imageAngle : 0,
            }}
            pointsWMed={analysis.mediasPoints}
            drawFunction={analysis.rectFunction}
            opening={analysis.opening}
            derivedFunction={analysis.derivedFunction}
            showNormals={showNormals}
            maskOverlay={maskOverlay}
            xViewport={xViewport}
          />
          <SimpleFunctionXY data={analysis.transversalAvgs} xViewport={xViewport} />
        </div>
      </Card>
    )
  },
})
