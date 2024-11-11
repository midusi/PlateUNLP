import type { SpectrumPoint } from "@/lib/spectral-data"
import { useGlobalStore } from "@/hooks/use-global-store"
import { useMeasure } from "@/hooks/use-measure"
import { getMaterialSpectralData } from "@/lib/spectral-data"
import { AxisBottom, AxisLeft } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { Circle, LinePath } from "@visx/shape"
import * as d3 from "@visx/vendor/d3-array"
import { useMemo } from "react"

// data accessors
const getX = (p: SpectrumPoint) => p?.wavelength ?? 0
const getY = (p: SpectrumPoint) => p?.intensity ?? 0

const height = 300
const margin = { top: 40, right: 30, bottom: 50, left: 55 }

export function ReferenceLampSpectrum() {
  const [material, rangeMin, rangeMax, materialPoints, setMaterialPoints] = useGlobalStore(s => [
    s.material,
    s.rangeMin,
    s.rangeMax,
    s.materialPoints,
    s.setMaterialPoints,
  ])

  const data = useMemo(() => getMaterialSpectralData(material), [material])
  const { filteredData, xScale, yScale } = useMemo(() => {
    let min = 0
    while (getX(data[min]) < rangeMin) min++
    let max = data.length - 1
    while (getX(data[max]) > rangeMax) max--

    const filteredData = data.slice(min, max + 1)
    return {
      filteredData,
      xScale: scaleLinear<number>({
        domain: d3.extent(filteredData, getX) as [number, number],
      }),
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

  // Spots logic
  const spotsInGraph: JSX.Element[] = []
  for (const [index, xVal] of materialPoints.entries()) {
    if ((filteredData[0].wavelength <= xVal)
      && (xVal <= filteredData[filteredData.length - 1].wavelength)) {
      const yMatch = data.reduce((prev, curr) => {
        return (Math.abs(curr.wavelength - xVal) < Math.abs(prev.wavelength - xVal) ? curr : prev)
      })
      if (yMatch) {
        const yVal = (height - margin.bottom) - (height - margin.bottom - margin.top - yScale(yMatch.intensity))
        const xClick = xScale(yMatch.wavelength) // remplaze xVal por yMatch.wavelength
        spotsInGraph.push(
          <Circle
            key={`circle-${index}`}
            cx={xClick + margin.left}
            cy={yVal}
            r={4}
            fill="red"
          />,
        )
      }
    }
  }
  function onClick(event: React.MouseEvent<SVGSVGElement>) {
    const svgRect = event.currentTarget.getBoundingClientRect()
    const xClick = event.clientX - svgRect.left - margin.left
    const xVal = xScale.invert(xClick)
    console.log(xClick, xVal)
    // console.log(xClick, xVal, filteredData[0], filteredData[filteredData.length - 1])
    setMaterialPoints([...materialPoints, xVal])
  }

  return (
    <div ref={measureRef}>
      <svg width={width} height={height} onClick={onClick}>
        {spotsInGraph}
        <Group top={margin.top} left={margin.left}>
          <GridColumns
            scale={xScale}
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
          <LinePath<SpectrumPoint>
            curve={curveLinear}
            data={filteredData}
            x={p => xScale(getX(p)) ?? 0}
            y={p => yScale(getY(p)) ?? 0}
            shapeRendering="geometricPrecision"
            className="stroke-primary stroke-1"
          />
          <AxisBottom
            scale={xScale}
            top={yMax}
            label="Wavelength (Å)"
            numTicks={Math.floor(xMax / 80)}
          />
          <AxisLeft scale={yScale} label="Intensity" />
        </Group>
      </svg>
    </div>
  )
}
