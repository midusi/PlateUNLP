import { AxisBottom, AxisLeft } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { localPoint } from "@visx/event"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { Circle, LinePath } from "@visx/shape"
import { Tooltip, useTooltip, useTooltipInPortal } from "@visx/tooltip"
import * as d3 from "@visx/vendor/d3-array"
import type { NumberValue, ScaleLinear } from "@visx/vendor/d3-scale"
import { useMemo } from "react"
import { GraphInErrorCase } from "~/components/molecules/GraphInErrorCase"
import { CustomError } from "~/lib/utils"

const height = 200
const width = 400
const margin = { top: 40, right: 30, bottom: 50, left: 55 }
const xMax = Math.max(width - margin.left - margin.right, 0)
const yMax = Math.max(height - margin.top - margin.bottom, 0)

const formatNumber = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format

const getX = (p: { Å: number; E: number }) => p.Å
const getY = (p: { Å: number; E: number }) => p.E

interface ErrorScatterGraphProps {
  pixelToWavelengthFunction: CustomError | ((value: number) => number)
  lampPoints: { x: number; y: number }[]
  materialPoints: { x: number; y: number }[]
}

export function ErrorScatterGraph({
  pixelToWavelengthFunction,
  lampPoints,
  materialPoints,
}: ErrorScatterGraphProps) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<{ idxMatch: number; Å: number; E: number }>()

  const { containerRef, TooltipInPortal: _ } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  })

  const handleMouseOver = (
    event: React.MouseEvent<SVGCircleElement, MouseEvent>,
    datum: { idxMatch: number; Å: number; E: number },
  ) => {
    const svg = event.currentTarget.ownerSVGElement // más seguro que target
    if (!svg) return

    const coords = localPoint(svg, event)
    if (!coords) return
    showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
      tooltipData: datum,
    })
  }

  /** Arreglo con x (Å indicado) e y (Å inferido) */
  const { dispersionErrors, xScale, yScale, mX } = useMemo((): {
    dispersionErrors: { idxMatch: number; Å: number; E: number }[]
    xScale: ScaleLinear<number, number, never>
    yScale: ScaleLinear<number, number, never>
    mX: number
    mY: number
  } => {
    /** Si no hay funcion no es necesario hacer calculos */
    if (pixelToWavelengthFunction instanceof CustomError)
      return {
        dispersionErrors: [],
        xScale: scaleLinear<number>({ domain: [0, 1000] }),
        yScale: scaleLinear<number>({ domain: [-1, 1] }),
        mX: 0,
        mY: 0,
      }

    /** Parejas {x:pixel, y:Åindicado} */
    const matches = []
    const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
    for (let i = 0; i < smallArr.length; i++) {
      matches.push({ x: lampPoints[i].x, y: materialPoints[i].x })
    }

    /** Parejas {Å:Åindicado, E:ÅerrorVsPredicho} */
    const dispersionErrors = matches.map((match, idx) => {
      const dispersionError = match.y - pixelToWavelengthFunction(match.x)
      return { idxMatch: idx, Å: match.y, E: dispersionError }
    })

    /** Escalas min y max para valores a mostrar en el grafico*/
    const xMin = d3.min(dispersionErrors, getX) ?? 0
    const xMax = d3.max(dispersionErrors, getX) ?? 1000
    const yMin = d3.min(dispersionErrors, getY) ?? -1
    const yMax = d3.max(dispersionErrors, getY) ?? 1
    const yLim = Math.max(Math.abs(yMin), Math.abs(yMax))
    const mX = 0.2 * (xMax - xMin)
    const mY = 0.2 * yLim
    const xScale = scaleLinear<number>({ domain: [xMin - mX, xMax + mX] })
    const yScale = scaleLinear<number>({ domain: [-yLim - mY, yLim + mY] })

    return { dispersionErrors, xScale, yScale, mX, mY }
  }, [lampPoints, materialPoints, pixelToWavelengthFunction])

  /** Pone al dia rangos numericos con resolucion de pantalla */
  xScale.range([0, xMax])
  yScale.range([yMax, 0])

  return (
    <div className="relative w-full overflow-visible">
      <h2 className="text-center font-bold text-lg">Graph of dispersion error</h2>
      <svg
        ref={containerRef}
        width={width}
        height={height}
        className="overflow-visible"
        role="img"
        aria-label="Graph of dispersion error"
      >
        {pixelToWavelengthFunction instanceof CustomError ? (
          <GraphInErrorCase
            message={pixelToWavelengthFunction.message}
            dimensions={{ height, width }}
            margin={margin}
            labels={{ x: "Wavelength (Å)", y: "Dispersion error" }}
          />
        ) : (
          <Group left={margin.left}>
            {/* Fondo del área del gráfico */}
            <rect
              x={0}
              y={0}
              width={xMax}
              height={yMax}
              fill="#374151" // un gris más oscuro que bg-gray-500
              rx={1} // opcional: esquinas redondeadas
            />
            <GridColumns
              scale={xScale}
              width={xMax}
              height={yMax}
              stroke="rgba(255,255,255,0.15)"
            />
            <GridRows scale={yScale} width={xMax} height={yMax} stroke="rgba(255,255,255,0.15)" />
            <LinePath<{ Å: number; E: number }>
              curve={curveLinear}
              data={[
                { Å: (d3.min(dispersionErrors, getX) ?? 0) - mX, E: 0 },
                { Å: (d3.max(dispersionErrors, getX) ?? 0) + mX, E: 0 },
              ]}
              x={(p) => xScale(getX(p)) ?? 0}
              y={(p) => yScale(getY(p)) ?? 0}
              shapeRendering="geometricPrecision"
              className="stroke-1"
              style={{ stroke: "grey", strokeDasharray: "4 4" }}
            />
            {dispersionErrors.map((match, _idx) => (
              <Circle
                key={`ErrorScatterGraphDot-${match.Å}-${match.E}`}
                className="dot"
                cx={xScale(getX(match))}
                cy={yScale(getY(match))}
                stroke="grey"
                r={3}
                fill={tooltipData === match ? "white" : "#f6c431"}
                onMouseOver={(e) => handleMouseOver(e, match)}
                onMouseOut={hideTooltip}
                // {/* #{index} */}
              />
            ))}

            <AxisBottom
              scale={xScale}
              top={yMax}
              label="Wavelength (Å)"
              numTicks={Math.floor(xMax / 40)}
              tickFormat={(value: NumberValue) => formatNumber(Number(value))}
            />
            <AxisLeft
              scale={yScale}
              label="Dispersion error"
              numTicks={5}
              tickFormat={(value: NumberValue) => formatNumber(Number(value))}
            />
          </Group>
        )}
      </svg>
      {tooltipOpen && tooltipData && tooltipTop && tooltipLeft && (
        <Tooltip className="w-30" left={tooltipLeft + 10} top={tooltipTop + 10}>
          <div className="w-full " style={{ display: "inline-block" }}>
            <span className="flex justify-center pb-2 font-bold ">#{tooltipData.idxMatch}</span>
            <div className="flex justify-between">
              <span className="font-bold">Å:</span>
              <span className="text-right font-mono">{formatNumber(getX(tooltipData))}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">E:</span>
              <span className="text-right font-mono">{formatNumber(getY(tooltipData))}</span>
            </div>
          </div>
        </Tooltip>
      )}
    </div>
  )
}
