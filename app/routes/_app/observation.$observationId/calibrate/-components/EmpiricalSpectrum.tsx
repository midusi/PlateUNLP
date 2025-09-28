import { useMeasure } from "@uidotdev/usehooks"
import { AxisBottom, AxisLeft, AxisTop } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { localPoint } from "@visx/event"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { Bar, Line, LinePath } from "@visx/shape"
import { defaultStyles, TooltipWithBounds, useTooltip } from "@visx/tooltip"
import * as d3 from "@visx/vendor/d3-array"
import type { NumberValue } from "@visx/vendor/d3-scale"
import { useCallback, useMemo } from "react"
import { CustomError } from "~/lib/utils"

// data accessors
const getX = (p: { pixel: number; intensity: number }) => p?.pixel ?? 0
const getY = (p: { pixel: number; intensity: number }) => p?.intensity ?? 0

interface EmpiricalSpectrumProps {
  data: {
    pixel: number
    intensity: number
  }[]
  lampPoints: { x: number; y: number }[]
  setLampPoints: (arr: { x: number; y: number }[]) => void
  pixelToWavelengthFunction: CustomError | ((value: number) => number)
}
const height = 150
/** Problema al agregar margenes a izquierda y derecha */
const margin = { top: 0, right: 12, bottom: 40, left: 12 }

const tooltipStyles = {
  ...defaultStyles,
  background: "#3b6978",
  border: "1px solid white",
  color: "white",
}

export function EmpiricalSpectrum({
  data,
  lampPoints,
  setLampPoints,
  pixelToWavelengthFunction,
}: EmpiricalSpectrumProps) {
  const isPixelToWavelengthValid = !(pixelToWavelengthFunction instanceof CustomError)

  // bounds
  const [measureRef, measured] = useMeasure<HTMLDivElement>()
  const width = measured.width ?? 0
  const xMax = Math.max(width - margin.left - margin.right, 0)
  const yMax = Math.max(height - margin.top - margin.bottom, 0)

  const { tooltipData, tooltipLeft, tooltipTop, showTooltip, hideTooltip } = useTooltip<{
    pixel: number
    intensity: number
  }>()

  const wavelengthScale = useMemo(
    () =>
      scaleLinear({
        range: [0, width - margin.right - margin.left],
        domain: [0, data.length - 1],
      }),
    [width, data.length],
  )

  const wavelengthBisector = d3.bisector<
    {
      pixel: number
      intensity: number
    },
    number
  >((d) => d.pixel).right

  const intensityScale = useMemo(
    () =>
      scaleLinear({
        range: [height - margin.bottom - margin.top, 0],
        domain: [0, (d3.max(data, getY) || 1) * 1.1],
        nice: true,
      }),
    [data],
  )

  const handleTooltip = useCallback(
    (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
      let { x } = localPoint(event) || { x: 0 }
      x = x - margin.left
      const x0 = wavelengthScale.invert(x)
      const index = wavelengthBisector(data, x0)
      const d0 = data[index - 1]
      const d1 = data[index]
      /** Elegir el elemento mas cercano */
      let d = d0
      if (d1 && getX(d1)) {
        const x0v = x0.valueOf()
        const x0d = getX(d0).valueOf()
        const x1d = getX(d1).valueOf()

        d = x0v - x0d > x1d - x0v ? d1 : d0
      }

      showTooltip({
        tooltipData: {
          pixel: d.pixel,
          /* Da problemas con mas de un elemento */
          intensity: d.intensity,
        },
        tooltipLeft: x,
        /* Da problemas con mas de un elemento */
        tooltipTop: intensityScale(getY(d)),
      })
    },
    [data, showTooltip, intensityScale, wavelengthScale, wavelengthBisector],
  )

  /** Manejar click en el grafico */
  function onClick(event: React.MouseEvent<Element>) {
    const svgRect = event.currentTarget.getBoundingClientRect()
    const xClick = event.clientX - svgRect.left
    const xVal = wavelengthScale.invert(xClick)

    setLampPoints([
      ...lampPoints,
      {
        x: xVal,
        y: 0, // El registro de intensidad se esta desperdiciando
      },
    ])
  }

  /** Permite al usuario borrar las longitudes de onda que marco */
  function handleUserMarkDelete(x: number) {
    setLampPoints(lampPoints.filter((mp) => mp.x !== x))
  }

  return (
    <div ref={measureRef} className="relative" style={{ height: `${height}px` }}>
      <svg width={width} height={height} role="img" aria-label="Empirical Spectrum">
        <Group top={margin.top} left={margin.left}>
          <rect x={0} y={0} width={xMax} height={yMax} fill="#374151" rx={1} />
          <GridColumns
            scale={wavelengthScale}
            width={xMax}
            height={yMax}
            stroke="rgba(255,255,255,0.15)"
          />
          <GridRows
            scale={intensityScale}
            width={xMax}
            height={yMax}
            stroke="rgba(255,255,255,0.15)"
          />
          {/* Espectro */}
          <LinePath<{ pixel: number; intensity: number }>
            data={data}
            curve={curveLinear}
            x={(p) => wavelengthScale(getX(p)) ?? 0}
            y={(p) => intensityScale(getY(p)) ?? 0}
            shapeRendering="geometricPrecision"
            className="stroke-1"
            style={{ stroke: "#0ea5e9" }}
          />
          {/** Capturar eventos del mouse */}
          <Bar
            x={0}
            y={0}
            width={xMax}
            height={yMax}
            fill="transparent"
            //rx={16}
            onClick={onClick}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />
          {/* Referencia visual de lo que se va a seleccionar */}
          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft ?? -1, y: 0 }}
                to={{
                  x: tooltipLeft ?? -1,
                  y: height - margin.bottom - margin.top,
                }}
                stroke="#3B82F6"
                strokeWidth={2}
                pointerEvents="none"
                strokeDasharray="5,2"
              />
              {/* Punto señalador de intensidad */}
              {/* <circle
								cx={tooltipLeft ?? -1}
								cy={(tooltipTop ?? -1) - margin.top}
								r={3}
								fill="#75daad"
								stroke="white"
								strokeWidth={1}
								pointerEvents="none"
							/> */}
            </g>
          )}
          {/* Referencias marcadas por el usuario */}
          {lampPoints.map((lp, idx) => {
            const xClick = wavelengthScale(lp.x)
            // const yPix = (height - margin.bottom) - (height - margin.bottom - margin.top - yScale(point.y))

            return (
              <g key={`EmpiricalLine-${lp.x}`}>
                <Line
                  x1={xClick}
                  y1={0}
                  x2={xClick}
                  y2={yMax}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeDasharray="5,2"
                />
                {/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
                <rect // Area cliqueable
                  x={xClick - 2}
                  y={0}
                  width={4}
                  height={yMax}
                  fill="transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUserMarkDelete(lp.x)
                  }}
                  style={{
                    cursor:
                      "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2216%22 width=%2216%22><text y=%2214%22 font-size=%2216%22 fill=%22red%22>✖</text></svg>') 8 8, not-allowed",
                  }}
                />
                <text
                  x={xClick + 5}
                  y={10}
                  fill="#FFFFFF"
                  fontSize="12"
                  fontFamily="Arial, sans-serif"
                >
                  #{`${idx}`}
                </text>
              </g>
            )
          })}

          <AxisBottom
            scale={wavelengthScale}
            top={yMax}
            label="Wavelength (Å)"
            numTicks={Math.floor(xMax / 80)}
            tickFormat={
              isPixelToWavelengthValid
                ? (value: NumberValue) => {
                    const numericValue = Number(value)
                    return Number.isNaN(numericValue)
                      ? "-"
                      : pixelToWavelengthFunction(numericValue).toFixed(0)
                  }
                : (_value: NumberValue) => "-"
            }
          />
          {/** En caso de que falten requisitos para la inferencia los informa */}
          {!isPixelToWavelengthValid && (
            <text
              x={width / 2}
              y={yMax + 20}
              fill="red"
              fontSize="12"
              fontFamily="Arial, sans-serif"
              textAnchor="middle"
            >
              {`${pixelToWavelengthFunction.message}`}
            </text>
          )}
        </Group>
      </svg>
      {/* {tooltipData && (
				<div>
					<TooltipWithBounds
						key={Math.random()}
						top={(height - margin.top - margin.bottom) / 10}
						left={(tooltipLeft ?? 0) + margin.left + margin.top}
						style={tooltipStyles}
					>
						{`px ${tooltipData.pixel}`}
					</TooltipWithBounds>
				</div>
			)} */}
    </div>
  )
}
