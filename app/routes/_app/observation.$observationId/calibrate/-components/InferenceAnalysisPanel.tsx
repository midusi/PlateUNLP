import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { type CustomError, cn } from "~/lib/utils"
import { ErrorScatterGraph } from "./ErrorScatterGraph"
import { InferenceBoxGraph } from "./InferenceBoxGraph"

type Unit = "Å" | "km/s"

interface InferenceAnalysisPanelProps {
  pixelToWavelengthFunction: CustomError | ((value: number) => number)
  lampPoints: { x: number; y: number }[]
  materialPoints: { x: number; y: number }[]
  onDeleteIndex: (index: number) => void
}

/**
 * Graficos de analisis del ajuste. En pantallas anchas (lg) es una columna lateral
 * fija; en las angostas queda pegado al borde inferior, con los graficos lado a lado
 * a partir de sm y apilados por debajo.
 */
export function InferenceAnalysisPanel({
  pixelToWavelengthFunction,
  lampPoints,
  materialPoints,
  onDeleteIndex,
}: InferenceAnalysisPanelProps) {
  const [unit, setUnit] = useState<Unit>("Å")
  /** Solo tiene efecto cuando los graficos estan apilados en pantallas angostas */
  const [errorGraphFirst, setErrorGraphFirst] = useState(false)

  return (
    <Card className="sticky bottom-0 z-20 gap-1 py-2 pb-0 shadow-lg lg:top-2 lg:bottom-auto lg:self-start">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-1">
        <CardTitle className="text-sm">Inference analysis</CardTitle>
        <div className="flex items-center gap-1 font-semibold text-slate-500 text-sm">
          Error unit: [
          <select
            value={unit}
            className="rounded-lg bg-gray-100 text-sm"
            style={{ textAlign: "center", textAlignLast: "center" }}
            onChange={(e) => setUnit(e.target.value as Unit)}
          >
            <option value="Å">Å</option>
            <option value="km/s">km/s</option>
          </select>
          ]
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 items-center gap-1.5 px-6 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <h2 className="text-center font-bold text-xs leading-tight">Xpixel Vs Wavelength</h2>
          <InferenceBoxGraph
            pixelToWavelengthFunction={pixelToWavelengthFunction}
            lampPoints={lampPoints}
            materialPoints={materialPoints}
          />
        </div>
        <div className={cn(errorGraphFirst && "max-sm:order-first")}>
          <div className="flex items-center justify-between sm:justify-center">
            <h2 className="font-bold text-xs leading-tight">Graph of dispersion error</h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] sm:hidden"
              onClick={() => setErrorGraphFirst((prev) => !prev)}
            >
              {errorGraphFirst ? "Mover abajo" : "Mover arriba"}
            </Button>
          </div>
          <ErrorScatterGraph
            pixelToWavelengthFunction={pixelToWavelengthFunction}
            lampPoints={lampPoints}
            materialPoints={materialPoints}
            unit={unit}
            onDeleteIndex={onDeleteIndex}
          />
        </div>
      </CardContent>
    </Card>
  )
}
