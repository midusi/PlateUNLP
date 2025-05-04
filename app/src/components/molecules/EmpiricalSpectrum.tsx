import type { NumberValue } from "@visx/vendor/d3-scale"
import type { JSX } from "react/jsx-runtime"
import { useGlobalStore } from "@/hooks/use-global-store"
import { useMeasure } from "@/hooks/use-measure"
import { CustomError } from "@/lib/utils"
import { AxisBottom, AxisLeft, AxisTop } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { Line, LinePath } from "@visx/shape"
import * as d3 from "@visx/vendor/d3-array"
import { useMemo } from "react"

export interface EmpiricalSpectrumPoint {
  pixel: number
  intensity: number
}

// data accessors
const getX = (p: EmpiricalSpectrumPoint) => p?.pixel ?? 0
const getY = (p: EmpiricalSpectrumPoint) => p?.intensity ?? 0

interface EmpiricalSpectrumProps {
  data: EmpiricalSpectrumPoint[]
  color: string
  interactable: boolean
  preview: boolean
  showPixel?: boolean
}

export function EmpiricalSpectrum({ data, color, interactable = true, preview = true, showPixel = false }: EmpiricalSpectrumProps) {
  const height = 200
  const margin = {
    top: showPixel ? 40 : 0,
    right: 0,
    bottom: 40,
    left: 50,
  }
  const [lampPoints, setLampPoints, linesPalette, materialPoints, pixelToWavelengthFunction] = useGlobalStore(s => [
    s.lampPoints,
    s.setLampPoints,
    s.linesPalette,
    s.materialPoints,
    s.pixelToWavelengthFunction,
  ])

  const isPixelToWavelengthValid = !(pixelToWavelengthFunction instanceof CustomError)

  // bounds
  const [measureRef, measured] = useMeasure<HTMLDivElement>()
  const width = measured.width ?? 0
  const xMax = Math.max(width - margin.left - margin.right, 0)
  const yMax = Math.max(height - margin.top - margin.bottom, 0)

  const { xScalePixel, xScaleWavelength, yScale } = useMemo(() => {
    return {
      data,
      xScalePixel: scaleLinear<number>({ domain: [0, d3.max(data, getX)!] }),
      xScaleWavelength: scaleLinear<number>({ domain: [0, d3.max(data, getX)!] }),
      yScale: scaleLinear<number>({ domain: [0, d3.max(data, getY)!] }),
    }
  }, [data])

  // update scale output ranges
  xScalePixel.range([0, xMax])
  xScaleWavelength.range([0, xMax])
  yScale.range([yMax, 0])

  const spotsInGraph: JSX.Element[] = []
  if (interactable) {
    for (const [index, point] of lampPoints.entries()) {
      const xClick = xScalePixel(point.x)
      // const yPix = (height - margin.bottom) - (height - margin.bottom - margin.top - yScale(point.y))
      spotsInGraph.push(
        <g key={`EmpiricalLine-${index}`}>
          <Line
            x1={xClick + margin.left}
            y1={0 + margin.top}
            x2={xClick + margin.left}
            y2={height - margin.bottom}
            stroke={linesPalette[index % linesPalette.length]}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          <text
            x={xClick + margin.left + 5}
            y={margin.top + 20}
            fill={linesPalette[index % linesPalette.length]}
            fontSize="12"
            fontFamily="Arial, sans-serif"
          >
            #
            {`${index}`}
          </text>
        </g>,
      )
    }
  }

  function onClick(event: React.MouseEvent<SVGSVGElement>) {
    const svgRect = event.currentTarget.getBoundingClientRect()
    const xClick = event.clientX - svgRect.left - margin.left
    const xVal = xScalePixel.invert(xClick)
    const yMatch = data[Math.round(xVal) - 1]
    if (yMatch) {
      const newVal = {
        x: yMatch.pixel, // Redefino xVal a la posicion mas cercana
        y: yMatch.intensity,
      }
      // Si el punto cliquieado esta ocupado se borra la linea que lo ocupa
      if (lampPoints.some(p => p.x === newVal.x && p.y === newVal.y)) {
        setLampPoints(lampPoints.filter(
          point => !(point.x === newVal.x && point.y === newVal.y),
        ))
        return
      }

      const newLampPoints = [...lampPoints]
      // Si no hay punto homologo borramos el punto de su ultima posicion antes de graficar
      if (lampPoints.length > materialPoints.length) {
        newLampPoints.pop()
      }
      setLampPoints([...newLampPoints, newVal])
    }
  }

  return (
    <div ref={measureRef}>
      <svg width={width} height={height} onClick={interactable ? onClick : undefined}>
        {interactable && spotsInGraph}
        <Group top={margin.top} left={margin.left}>
          <GridColumns
            scale={xScalePixel}
            width={xMax}
            height={yMax}
            className="stroke-neutral-100"
          />
          <GridRows
            scale={yScale}
            width={xMax}
            height={yMax}
            className="stroke-neutral-100"
          />
          <LinePath<EmpiricalSpectrumPoint>
            curve={curveLinear}
            data={data}
            x={p => xScalePixel(getX(p)) ?? 0}
            y={p => yScale(getY(p)) ?? 0}
            shapeRendering="geometricPrecision"
            className="stroke-1"
            style={{ stroke: color }}
          />
          {showPixel && (
            <AxisTop
              scale={xScalePixel}
              label="Pixel"
              numTicks={Math.floor(xMax / 80)}
            />
          )}
          {preview && (
            <>
              <AxisBottom
                scale={xScaleWavelength}
                top={yMax}
                label="Wavelength (Å)"
                numTicks={Math.floor(xMax / 80)}
                tickFormat={
                  isPixelToWavelengthValid
                    ? (value: NumberValue) => {
                        const numericValue = Number(value)
                        return Number.isNaN(numericValue)
                          ? "-"
                          : pixelToWavelengthFunction(numericValue).toFixed(2)
                      }
                    : (_value: NumberValue) => "-"
                }
              />
              {!isPixelToWavelengthValid
                && (
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
            </>
          )}
          <AxisLeft scale={yScale} label="Intensity" />
        </Group>
      </svg>
    </div>
  )
}
