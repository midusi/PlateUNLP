import { useMeasure } from "@uidotdev/usehooks"
import { AxisBottom, AxisLeft } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { PatternLines } from "@visx/pattern"
import { scaleLinear } from "@visx/scale"
import { LinePath } from "@visx/shape"
import * as d3 from "@visx/vendor/d3-array"
import { useId, useMemo } from "react"
import { materialsPalette } from "~/lib/materials-palette"
import type { SpectrumPoint } from "~/lib/spectral-data"

// data accessors
const getX = (p: SpectrumPoint) => p.wavelength
const getY = (p: SpectrumPoint) => p.intensity

const height = 150
const margin = { top: 20, right: 8, bottom: 40, left: 50 }

type ReferenceLampRangeProps = {
  material: string
  materialArr: {
    wavelength: number
    material: string
    intensity: number
  }[]
  minWavelength: number
  setMinWavelength: (min: number) => void
  maxWavelength: number
  setMaxWavelength: (max: number) => void
}

export function ReferenceLampRange({
  material,
  materialArr,
  minWavelength,
  setMinWavelength,
  maxWavelength,
  setMaxWavelength,
}: ReferenceLampRangeProps) {
  const patternId = useId()

  /** Minimos y maximos totales y especificos al range */
  const materialArrXMax = d3.max(materialArr, getX)!
  const materialArrXMin = d3.min(materialArr, getX)!
  const materialArrYMax = d3.max(materialArr, getY)!
  const xScale = scaleLinear<number>({ domain: [0, materialArrXMax] })
  const yScale = scaleLinear<number>({ domain: [0, materialArrYMax] })
  const rangeMin = Math.max(minWavelength, materialArrXMin)
  const rangeMax = Math.min(maxWavelength, materialArrXMax)

  // bounds
  const [measureRef, measured] = useMeasure<HTMLDivElement>()
  const width = measured.width ?? 0
  const xMax = Math.max(width - margin.left - margin.right, 0)
  const yMax = Math.max(height - margin.top - margin.bottom, 0)

  // update scale output ranges
  xScale.range([0, xMax])
  yScale.range([yMax, 0])

  /** Aislar datos de materiales */
  const [datas, materials] = useMemo(() => {
    const materials = material.split("-")
    const datas: SpectrumPoint[][] = []
    for (const m of materials) {
      const nameList = [m].flatMap((m) => [m, `${m} I`, `${m} II`])
      const d = materialArr.filter((d) => nameList.includes(d.material))
      datas.push(d)
    }
    return [datas, materials]
  }, [materialArr, material])

  return (
    <div ref={measureRef} className="flex justify-center">
      <svg width={width} height={height}>
        <title>Visual selector of min and max Wavelenght</title>
        <Group top={margin.top} left={margin.left}>
          <GridColumns scale={xScale} width={xMax} height={yMax} className="stroke-neutral-100" />
          <GridRows scale={yScale} width={xMax} height={yMax} className="stroke-neutral-100" />
          {datas.map((d, index) => (
            <LinePath<SpectrumPoint>
              key={`material_range_line-${materials[index]}`}
              curve={curveLinear}
              data={d}
              x={(p) => xScale(getX(p)) ?? 0}
              y={(p) => yScale(getY(p)) ?? 0}
              shapeRendering="geometricPrecision"
              className="stroke-1"
              stroke={materialsPalette[index % materialsPalette.length]}
            />
          ))}
          <AxisBottom
            scale={xScale}
            top={yMax}
            label="Wavelength (Å)"
            numTicks={Math.floor(xMax / 80)}
          />
          <AxisLeft scale={yScale} label="Intensity" numTicks={4} />

          <PatternLines
            id={patternId}
            height={8}
            width={8}
            orientation={["diagonal"]}
            className="stroke-1 stroke-neutral-500/60"
          />

          <Group left={0}>
            <rect
              width={xScale(rangeMin)}
              height={yMax}
              className="pointer-events-none stroke-0"
              fill={`url(#${patternId})`}
            />
            <ResizeHandler
              left={xScale(rangeMin)}
              height={yMax}
              onMove={(dx) => {
                const newMin = rangeMin + Math.sign(dx) * xScale.invert(Math.abs(dx))
                if (newMin >= xScale.domain()[0] && xScale(rangeMax) - xScale(newMin) >= 20) {
                  // Update only if there are at least 20 pixels between the two thumbs.
                  setMinWavelength(newMin)
                }
              }}
            />
          </Group>

          <Group left={xScale(rangeMax)}>
            <rect
              width={xMax - xScale(rangeMax)}
              height={yMax}
              className="pointer-events-none stroke-0"
              fill={`url(#${patternId})`}
            />
            <ResizeHandler
              left={0}
              height={yMax}
              onMove={(dx) => {
                const newMax = rangeMax + Math.sign(dx) * xScale.invert(Math.abs(dx))
                if (newMax <= xScale.domain()[1] && xScale(newMax) - xScale(rangeMin) >= 20) {
                  // Update only if there are at least 20 pixels between the two thumbs.
                  setMaxWavelength(newMax)
                }
              }}
            />
          </Group>
        </Group>
      </svg>
    </div>
  )
}

function ResizeHandler({
  height,
  left,
  onMove,
}: {
  height: number
  left: number
  onMove?: (dx: number) => void
}) {
  const pathWidth = 8
  const pathHeight = 15

  return (
    <Group
      left={left}
      onPointerDown={(event) => {
        const target = event.target as HTMLElement
        target.setPointerCapture(event.pointerId)
        // Prevent browser focus behaviour because we focus a thumb manually when values change.
        event.preventDefault()
      }}
      onPointerMove={(event) => {
        const target = event.target as HTMLElement
        if (target.hasPointerCapture(event.pointerId)) {
          const dx = event.clientX - (target.getBoundingClientRect().x + pathWidth / 2)
          onMove?.(dx)
        }
      }}
      onPointerUp={(event) => {
        const target = event.target as HTMLElement
        if (target.hasPointerCapture(event.pointerId)) {
          target.releasePointerCapture(event.pointerId)
        }
      }}
    >
      <line x1={0} x2={0} y1={0} y2={height} className="stroke-1 stroke-neutral-700" />
      <Group left={0} top={(height - pathHeight) / 2}>
        <path
          d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
          className="cursor-ew-resize fill-neutral-50 stroke-1 stroke-neutral-400"
        />
      </Group>
    </Group>
  )
}
