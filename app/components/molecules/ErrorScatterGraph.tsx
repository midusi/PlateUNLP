import { AxisBottom, AxisLeft } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { Circle, LinePath } from "@visx/shape"
import * as d3 from "@visx/vendor/d3-array"
import { useMemo } from "react"
import { useGlobalStore } from "~/hooks/use-global-store"
import { CustomError } from "~/lib/utils"
import { GraphInErrorCase } from "./GraphInErrorCase"

const height = 200
const width = 400
const margin = { top: 40, right: 30, bottom: 50, left: 55 }
const xMax = Math.max(width - margin.left - margin.right, 0)
const yMax = Math.max(height - margin.top - margin.bottom, 0)

export interface Point {
  x: number
  y: number
}

const getX = (p: Point) => p?.x ?? 0
const getY = (p: Point) => p?.y ?? 0

interface ErrorScatterComponentsProps {
  pixelToWavelengthFunction: (value: number) => number
}

function ErrorScatterComponents({ pixelToWavelengthFunction }: ErrorScatterComponentsProps) {
  const [lampPoints, materialPoints] = useGlobalStore((s) => [s.lampPoints, s.materialPoints])

  const matches: Point[] = useMemo((): Point[] => {
    const matches: Point[] = []
    const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
    for (let i = 0; i < smallArr.length; i++) {
      matches.push({ x: lampPoints[i].x, y: materialPoints[i].x })
    }
    return matches
  }, [lampPoints, materialPoints])

  const dispersionErrors: Point[] = useMemo((): Point[] => {
    const dispersionErrors: Point[] = matches.map((match) => {
      const dispersionError = match.y - pixelToWavelengthFunction(match.x)
      return { x: match.y, y: dispersionError }
    })
    return dispersionErrors
  }, [matches, pixelToWavelengthFunction])

  const { xScale, yScale } = useMemo(() => {
    const xMin = d3.min(dispersionErrors, getX)!
    const xMax = d3.max(dispersionErrors, getX)!
    const yMin = d3.min(dispersionErrors, getY)!
    const yMax = d3.max(dispersionErrors, getY)!
    const yLim = Math.ceil(Math.max(Math.abs(yMin), Math.max(yMax)))
    const marginX = 30
    const marginY = 0.2 * yLim

    return {
      xScale: scaleLinear<number>({ domain: [xMin - marginX, xMax + marginX] }),
      yScale: scaleLinear<number>({
        domain: [-yLim - marginY, yLim + marginY],
      }),
    }
  }, [dispersionErrors])

  // update scale output ranges
  xScale.range([0, xMax])
  yScale.range([yMax, 0])

  const spotsInGraph = dispersionErrors.map((match, index) => {
    const xPos = xScale(getX(match))
    const yPos = yScale(getY(match))

    if (!xPos || !yPos) return <g key={`ErrorScatterGraphGroup-${match.x}-${match.y}`}></g>

    return (
      <g key={`ErrorScatterGraphGroup-${match.x}-${match.y}`}>
        <Circle cx={xPos} cy={yPos} stroke="grey" r={3} />
        <text
          x={xPos + 5} // Ajusta el desplazamiento horizontal del texto
          y={yPos - 5} // Ajusta el desplazamiento vertical del texto
          fontSize="12"
          fontFamily="Arial, sans-serif"
          fill="black" // Asegúrate de establecer un color de relleno
        >
          #{index}
        </text>
      </g>
    )
  })

  return (
    <Group top={margin.top} left={margin.left}>
      {spotsInGraph}
      <GridColumns scale={xScale} width={xMax} height={yMax} className="stroke-neutral-100" />
      <GridRows scale={yScale} width={xMax} height={yMax} className="stroke-neutral-100" />
      <LinePath<Point>
        curve={curveLinear}
        data={[
          { x: d3.min(dispersionErrors, getX)! - 30, y: 0 },
          { x: d3.max(dispersionErrors, getX)! + 30, y: 0 },
        ]}
        x={(p) => xScale(getX(p)) ?? 0}
        y={(p) => yScale(getY(p)) ?? 0}
        shapeRendering="geometricPrecision"
        className="stroke-1"
        style={{ stroke: "grey", strokeDasharray: "4 4" }}
      />
      <AxisBottom
        scale={xScale}
        top={yMax}
        label="Wavelength (Å)"
        numTicks={Math.floor(xMax / 40)}
      />
      <AxisLeft scale={yScale} label="Dispersion error" numTicks={5} />
    </Group>
  )
}

export function ErrorScatterGraph() {
  const [pixelToWavelengthFunction] = useGlobalStore((s) => [s.pixelToWavelengthFunction])

  let content
  if (pixelToWavelengthFunction instanceof CustomError) {
    content = (
      <GraphInErrorCase
        message={pixelToWavelengthFunction.message}
        dimensions={{ height, width }}
        margin={margin}
        labels={{ x: "Wavelength (Å)", y: "Dispersion error" }}
      />
    )
  } else {
    content = <ErrorScatterComponents pixelToWavelengthFunction={pixelToWavelengthFunction} />
  }

  return (
    <div className="w-full">
      <svg
        className="w-full h-auto"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {content}
      </svg>
    </div>
  )
}
