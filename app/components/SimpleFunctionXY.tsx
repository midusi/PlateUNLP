import { curveStepAfter } from "@visx/curve"
import { ParentSize } from "@visx/responsive"
import { AreaSeries, Axis, Grid, lightTheme, XYChart } from "@visx/xychart"
import { useMemo } from "react"
import { useViewportGestures, type XViewportController } from "~/hooks/use-x-viewport"
import { cn } from "~/lib/utils"

interface Point {
  x: number
  y: number
}

interface SimpleFunctionXYProps {
  /** Valor de cada columna de pixeles del recorte. */
  data: number[]
  /** Rango de columnas visibles, compartido con la imagen del recorte. */
  xViewport: XViewportController
}

const CHART_HEIGHT = 140
/** Sin margen lateral: el area de trazado ocupa todo el ancho, igual que la imagen. */
const CHART_MARGIN = { top: 4, right: 0, bottom: 24, left: 0 }
/** Sube el titulo del eje a la fila de los extremos (por defecto va una fila mas abajo). */
const AXIS_LABEL_OFFSET = -7

const accessors = {
  xAccessor: (d: Point) => d.x,
  yAccessor: (d: Point) => d.y,
}

/**
 * Grafico 1D de un espectro, con el eje X en pixeles de la imagen.
 * Muestra solo el rango `xViewport`, y permite acercarse y desplazarse.
 */
export function SimpleFunctionXY({ data, xViewport }: SimpleFunctionXYProps) {
  const { viewport, isZoomed } = xViewport
  const gestureRef = useViewportGestures<HTMLDivElement>(xViewport)

  /**
   * La columna `i` ocupa `[i, i + 1)` en la imagen. Con `curveStepAfter` cada
   * escalon cubre justo ese intervalo, y el punto extra en `x = data.length`
   * cierra el escalon de la ultima columna.
   */
  const points = useMemo<Point[]>(() => {
    const columns = data.map((value, index) => ({ x: index, y: value }))
    return columns.concat({ x: data.length, y: data.at(-1) ?? 0 })
  }, [data])

  return (
    <div
      ref={gestureRef}
      className={cn("w-full touch-pan-y select-none overflow-hidden", isZoomed && "cursor-grab")}
    >
      <ParentSize>
        {({ width }) => {
          if (width === 0) return null // Esperar a que se mida
          return (
            <XYChart
              theme={lightTheme}
              xScale={{
                type: "linear",
                domain: [viewport.start, viewport.end],
                zero: false,
                nice: false,
              }}
              yScale={{ type: "linear" }}
              height={CHART_HEIGHT}
              width={width}
              margin={CHART_MARGIN}
            >
              <Axis
                orientation="bottom"
                label="Pixel"
                labelOffset={AXIS_LABEL_OFFSET}
                tickValues={[viewport.start, viewport.end]}
                tickFormat={(value) => `${Math.round(value)}`}
                tickLabelProps={(value) => ({
                  textAnchor: value <= viewport.start ? "start" : "end",
                  dx: value <= viewport.start ? 2 : -2,
                  fontSize: 11,
                })}
              />
              <Grid numTicks={10} />
              <AreaSeries
                curve={curveStepAfter}
                dataKey="Line 1"
                data={points}
                fill="#60a5fa" // Color del área
                fillOpacity={0.3} // Transparencia
                stroke="#3b82f6" // Color del borde (línea superior)
                {...accessors}
              />
            </XYChart>
          )
        }}
      </ParentSize>
    </div>
  )
}
