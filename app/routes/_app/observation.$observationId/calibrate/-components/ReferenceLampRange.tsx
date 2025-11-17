import { useMeasure } from "@uidotdev/usehooks"
import { AxisBottom } from "@visx/axis"
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

const margin = { top: 0, right: 12, bottom: 22, left: 12 }

type ReferenceLampRangeProps = {
  material: string
  materialArr: {
    wavelength: number
    material: string
    intensity: number
  }[]
  onlyOneLine: boolean
  minWavelength: number
  setMinWavelength: (min: number) => void
  maxWavelength: number
  setMaxWavelength: (max: number) => void
  hideX?: boolean
  height?: number
  backgroundColor?: string
}

export function ReferenceLampRange({
  material,
  materialArr,
  onlyOneLine,
  minWavelength,
  setMinWavelength,
  maxWavelength,
  setMaxWavelength,
  hideX,
  height = 100,
  backgroundColor = "#374151",
}: ReferenceLampRangeProps) {
  const patternId = useId()

  /** Margin a usar de forma local */
  const localMargin = { ...margin, bottom: hideX ? 0 : margin.bottom }

  /** Minimos y maximos totales y especificos al range */
  const materialArrXMax = Math.max(d3.max(materialArr, getX)!, 41000)
  const materialArrXMin = d3.min(materialArr, getX)!
  const materialArrYMax = d3.max(materialArr, getY)!
  const xScale = scaleLinear<number>({ domain: [0, materialArrXMax] })
  const yScale = scaleLinear<number>({ domain: [0, materialArrYMax] })
  const rangeMin = minWavelength
  const rangeMax = Math.max(maxWavelength, materialArrXMin)

  // bounds
  const [measureRef, measured] = useMeasure<HTMLDivElement>()
  const width = measured.width ?? 0
  const xMax = Math.max(width - localMargin.left - localMargin.right, 0)
  const yMax = Math.max(height - localMargin.top - localMargin.bottom, 0)

  // update scale output ranges
  xScale.range([0, xMax])
  yScale.range([yMax, 0])

  /** Arreglo de intensidades de materiales separados por etiquetas */
  const [materialArrForLabel] = useMemo(() => {
    let materialArrForLabel: {
      label: string
      arr: {
        wavelength: number
        material: string
        intensity: number
      }[]
    }[]

    if (onlyOneLine) {
      materialArrForLabel = [
        {
          label: material,
          arr: materialArr,
        },
      ]
    } else {
      /** Listado de etiquetas encontradas en el arreglo de materiales */
      const labels = new Set(materialArr.map((ma) => ma.material))
      /** Separar arreglo por etiqueta */
      materialArrForLabel = Array.from(labels).map((label) => ({
        label: label,
        arr: materialArr.filter((p) => p.material === label),
      }))
    }

    return [materialArrForLabel]
  }, [materialArr, material, onlyOneLine])

  return (
    <div ref={measureRef} className="flex justify-center">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Visual selector of min and max Wavelenght"
      >
        <Group top={localMargin.top} left={localMargin.left}>
          <rect x={0} y={0} width={xMax} height={yMax} fill={backgroundColor} rx={1} />
          <GridColumns
            scale={xScale}
            width={xMax}
            height={yMax}
            strokeWidth={0.1}
            stroke="rgba(255,255,255,0.15)"
          />
          <GridRows
            scale={yScale}
            width={xMax}
            height={yMax}
            strokeWidth={0.1}
            stroke="rgba(255,255,255,0.15)"
          />
          {materialArrForLabel.map((item, idx) => (
            <LinePath<SpectrumPoint>
              key={`material_range_line-${item.label}`}
              curve={curveLinear}
              data={item.arr}
              x={(p) => xScale(getX(p))}
              y={(p) => yScale(getY(p))}
              shapeRendering="geometricPrecision"
              className="stroke-1"
              stroke={materialsPalette[idx % materialsPalette.length]}
            />
          ))}
          {!hideX && (
            <AxisBottom
              scale={xScale}
              top={yMax}
              //label="Wavelength (Å)"
              numTicks={Math.floor(xMax / 80)}
            />
          )}

          <PatternLines
            id={patternId}
            height={1}
            width={1}
            orientation={["diagonal"]}
            className="stroke-1 stroke-neutral-500/60"
            //background="rgba(55,65,81,0.15)"
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
      <line x1={0} x2={0} y1={0} y2={height} className="stroke-1 stroke-neutral-500" />
      <Group left={0} top={(height - pathHeight) / 2}>
        <path
          d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
          className="cursor-ew-resize fill-neutral-50 stroke-1 stroke-neutral-400"
        />
      </Group>
    </Group>
  )
}
