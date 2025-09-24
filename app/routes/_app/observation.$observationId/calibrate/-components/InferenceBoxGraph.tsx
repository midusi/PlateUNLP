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
import useMeasure from "react-use-measure"
import { GraphInErrorCase } from "~/components/molecules/GraphInErrorCase"
import { CustomError, generateRange } from "~/lib/utils"

const formatNumber = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format

const getX = (p: { P: number; Å: number }) => p.P
const getY = (p: { P: number; Å: number }) => p.Å

const margin = { top: 20, right: 20, bottom: 40, left: 60 }

interface InferenceBoxGraphProps {
  pixelToWavelengthFunction: CustomError | ((value: number) => number)
  lampPoints: { x: number; y: number }[]
  materialPoints: { x: number; y: number }[]
}

export function InferenceBoxGraph({
  pixelToWavelengthFunction,
  lampPoints,
  materialPoints,
}: InferenceBoxGraphProps) {
  const [ref, bounds] = useMeasure()
  const width = bounds.width
  const height = bounds.height

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } =
    useTooltip<{ idxMatch: number; P: number; Å: number }>()

  const { containerRef, TooltipInPortal: _ } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  })

  /** Abrir tooltip al apuntar un punto */
  const handleMouseOver = (
    event: React.MouseEvent<SVGCircleElement, MouseEvent>,
    datum: { idxMatch: number; P: number; Å: number },
  ) => {
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return

    const coords = localPoint(svg, event)
    if (!coords) return
    showTooltip({
      tooltipLeft: coords.x,
      tooltipTop: coords.y,
      tooltipData: datum,
    })
  }

  /**
   * Arreglo de pares x (Å indicado) e y (Å inferido), y arreglo de funccion de
   * inferencia discretizada.
   */
  const { matches, discretizedFunction, xScale, yScale } = useMemo((): {
    matches: { idxMatch: number; P: number; Å: number }[]
    discretizedFunction: { P: number; Å: number }[]
    xScale: ScaleLinear<number, number, never>
    yScale: ScaleLinear<number, number, never>
    mX: number
    mY: number
  } => {
    /** Si no hay funcion no es necesario hacer calculos */
    if (pixelToWavelengthFunction instanceof CustomError)
      return {
        matches: [],
        discretizedFunction: [],
        xScale: scaleLinear<number>({ domain: [0, 1000] }),
        yScale: scaleLinear<number>({ domain: [-1, 1] }),
        mX: 0,
        mY: 0,
      }

    /** Parejas {x:pixel, y:Åindicado} */
    const matches: { idxMatch: number; P: number; Å: number }[] = []
    const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
    for (let i = 0; i < smallArr.length; i++) {
      matches.push({ idxMatch: i, P: lampPoints[i].x, Å: materialPoints[i].x })
    }

    /** Valores minimo y maximo en el eje X (pixeles del espextro extraido) */
    const xMin = d3.min(matches, getX)!
    const xMax = d3.max(matches, getX)!
    const mX = 0.2 * (xMax - xMin)

    /** Valores minimo y maximo en el eje Y (wavelength real) */
    const yMin = d3.min(matches, getY)!
    const yMax = d3.max(matches, getY)!
    const mY = 0.2 * (yMax - yMin)

    /** Discretizacion de funcion de inferencia para graficado */
    const resolution = width - margin.right - margin.left
    const discretizedFunction = generateRange(xMin - mX, xMax + mX, resolution)
      .map((value) => ({
        P: value,
        Å: pixelToWavelengthFunction(value),
      }))
      .filter((p) => p.Å >= yMin - mY && p.Å <= yMax + mY)

    return {
      matches: matches,
      discretizedFunction: discretizedFunction,
      xScale: scaleLinear<number>({ domain: [xMin - mX, xMax + mX], range: [] }),
      yScale: scaleLinear<number>({ domain: [yMin - mY, yMax + mY] }),
      mX: mX,
      mY: mY,
    }
  }, [lampPoints, materialPoints, pixelToWavelengthFunction, width])

  /** Pone al dia rangos numericos con resolucion de pantalla */
  xScale.range([margin.right, width - margin.left])
  yScale.range([height - margin.bottom - margin.top, 0])

  return (
    <div ref={ref} className="relative w-full">
      <svg
        ref={containerRef}
        width={width}
        height={400}
        role="img"
        aria-label="Xpixel Vs Wavelength"
      >
        {pixelToWavelengthFunction instanceof CustomError ? (
          <GraphInErrorCase
            message={pixelToWavelengthFunction.message}
            dimensions={{ height, width }}
            labels={{ x: "Pixel", y: "Wavelength (Å)" }}
          />
        ) : (
          <Group left={margin.left - margin.right} top={margin.top}>
            {/* Fondo del área del gráfico */}
            <rect
              x={margin.right}
              y={0}
              width={Math.max(width - margin.right - margin.left, 0)}
              height={Math.max(height - margin.bottom - margin.top, 0)}
              fill="#374151"
              rx={1}
            />
            <GridColumns
              left={margin.right}
              scale={xScale}
              width={width - margin.right - margin.left}
              height={height - margin.bottom - margin.top}
              stroke="rgba(255,255,255,0.15)"
            />
            <GridRows
              left={margin.right}
              scale={yScale}
              width={width - margin.right - margin.left}
              height={height - margin.bottom - margin.top}
              stroke="rgba(255,255,255,0.15)"
            />
            <LinePath<{ P: number; Å: number }>
              curve={curveLinear}
              data={discretizedFunction}
              x={(p) => xScale(p.P)}
              y={(p) => yScale(p.Å)}
              shapeRendering="geometricPrecision"
              className="stroke-1"
              style={{ stroke: "gray" }}
            />
            {matches.map((match, _) => (
              <Circle
                key={`InferenceBoxGraphDot-${getX(match)}-${getY(match)}`}
                cx={xScale(getX(match))}
                cy={yScale(getY(match))}
                stroke="grey"
                r={3}
                fill={tooltipData === match ? "white" : "#f6c431"}
                onMouseOver={(e) => handleMouseOver(e, match)}
                onMouseOut={hideTooltip}
              />
            ))}
            <AxisBottom
              scale={xScale}
              top={height - margin.bottom - margin.top}
              label="Pixel"
              numTicks={Math.floor(width / 80)}
              tickFormat={(value: NumberValue) => formatNumber(Number(value))}
            />
            <AxisLeft
              scale={yScale}
              left={margin.right}
              top={0}
              label="Wavelength (Å)"
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
              <span className="font-bold">P:</span>
              <span className="text-right font-mono">{formatNumber(getX(tooltipData))}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold">Å:</span>
              <span className="text-right font-mono">{formatNumber(getY(tooltipData))}</span>
            </div>
          </div>
        </Tooltip>
      )}
    </div>
  )
}
