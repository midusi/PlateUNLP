import type { SpectrumPoint } from "@/lib/spectral-data"
import { useGlobalStore } from "@/hooks/use-global-store"
import { useMeasure } from "@/hooks/use-measure"
import { getMaterialSpectralData } from "@/lib/spectral-data"
import { AxisBottom, AxisLeft } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { LinePath } from "@visx/shape"
import * as d3 from "@visx/vendor/d3-array"
import { useMemo } from "react"

// data accessors
const getX = (p: SpectrumPoint) => p?.wavelength ?? 0
const getY = (p: SpectrumPoint) => p?.intensity ?? 0

const height = 300
const margin = { top: 40, right: 30, bottom: 50, left: 55 }

export function ReferenceLampSpectrum() {
  const [material, rangeMin, rangeMax] = useGlobalStore(s => [s.material, s.rangeMin, s.rangeMax])

  const data = useMemo(() => getMaterialSpectralData(material), [material])
  const { filteredData, xScale, yScale } = useMemo(() => {
    let min = 0
    while (getX(data[min]) < rangeMin) min++
    let max = data.length - 1
    while (getX(data[max]) > rangeMax) max--

    const filteredData = data.slice(min, max + 1)
    return {
      filteredData,
      xScale: scaleLinear<number>({ domain: d3.extent(filteredData, getX) as [number, number] }),
      yScale: scaleLinear<number>({ domain: [0, d3.max(filteredData, getY)!] }),
    }
  }, [data, rangeMin, rangeMax])

  // bounds
  const [measureRef, measured] = useMeasure<HTMLDivElement>()
  const width = measured.width ?? 0
  const xMax = Math.max(width - margin.left - margin.right, 0)
  const yMax = Math.max(height - margin.top - margin.bottom, 0)

  // update scale output ranges
  xScale.range([0, xMax])
  yScale.range([yMax, 0])

  return (
    <div ref={measureRef}>
      <svg width={width} height={height}>
        <Group top={margin.top} left={margin.left}>
          <GridColumns scale={xScale} width={xMax} height={yMax} className="stroke-neutral-100" />
          <GridRows scale={yScale} width={xMax} height={yMax} className="stroke-neutral-100" />
          <LinePath<SpectrumPoint>
            curve={curveLinear}
            data={filteredData}
            x={p => xScale(getX(p)) ?? 0}
            y={p => yScale(getY(p)) ?? 0}
            strokeWidth={1}
            strokeOpacity={1}
            shapeRendering="geometricPrecision"
            className="stroke-primary"
          />
          <AxisBottom
            scale={xScale}
            top={yMax}
            label="Wavelength (Å)"
            numTicks={Math.floor(xMax / 80)}
          />
          <AxisLeft
            scale={yScale}
            label="Intensity"
          />
        </Group>
      </svg>
    </div>
  )
}
