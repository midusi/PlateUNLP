import { useMeasure } from "@uidotdev/usehooks"
import { AxisBottom, AxisLeft } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { Line, LinePath } from "@visx/shape"
import * as d3 from "@visx/vendor/d3-array"
import type { JSX } from "react"
import { useMemo } from "react"
import { useGlobalStore } from "~/hooks/use-global-store"
import type { SpectrumPoint } from "~/lib/spectral-data"
import { getMaterialSpectralData } from "~/lib/spectral-data"

// data accessors
const getX = (p: SpectrumPoint) => p?.wavelength ?? 0
const getY = (p: SpectrumPoint) => p?.intensity ?? 0

const height = 200
const margin = { top: 6, right: 0, bottom: 40, left: 50 }

export function ReferenceLampSpectrum() {
  const [
    material,
    rangeMin,
    rangeMax,
    materialPoints,
    setMaterialPoints,
    linesPalette,
    lampPoints,
    oneTeoricalSpectrum,
  ] = useGlobalStore((s) => [
    s.material,
    s.rangeMin,
    s.rangeMax,
    s.materialPoints,
    s.setMaterialPoints,
    s.linesPalette,
    s.lampPoints,
    s.oneTeoricalSpectrum,
  ])
  const materialsPalette = useGlobalStore((s) => s.materialsPalette)

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

  // Material division
  const [filteredDatas, materials] = useMemo(() => {
    let materials = material.split("-")
    let filteredDatas: SpectrumPoint[][]
    if (oneTeoricalSpectrum) {
      materials = [`${material}`]
      filteredDatas = [filteredData]
    } else {
      materials = material.split("-")
      filteredDatas = []
      for (const m of materials) {
        const nameList = [m].flatMap((m) => [m, `${m} I`, `${m} II`])
        const d = filteredData.filter((d) => nameList.includes(d.material))
        filteredDatas.push(d)
      }
    }
    return [filteredDatas, materials]
  }, [filteredData, material, oneTeoricalSpectrum])

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
  for (const [index, point] of materialPoints.entries()) {
    if (
      filteredData[0].wavelength <= point.x &&
      point.x <= filteredData[filteredData.length - 1].wavelength
    ) {
      const xClick = xScale(point.x)
      // const yPix = (height - margin.bottom) - (height - margin.bottom - margin.top - yScale(point.y))
      spotsInGraph.push(
        <g key={`LampSpectrumLine-${index}`}>
          <Line
            x1={xClick + margin.left}
            y1={0 + margin.top} // Valor inicial en el eje y
            x2={xClick + margin.left}
            y2={height - margin.bottom} // Altura del gráfico
            stroke={linesPalette[index % linesPalette.length]}
            strokeWidth={2}
            strokeDasharray="4 4" // Define el patrón de punteado
          />
          <text
            x={xClick + margin.left + 5} // Ajusta el desplazamiento horizontal del texto
            y={margin.top + 10} // Ajusta el desplazamiento vertical del texto
            fill={linesPalette[index % linesPalette.length]} // Usa el mismo color de la línea
            fontSize="12" // Tamaño de fuente
            fontFamily="Arial, sans-serif" // Familia de fuente
          >
            #{`${index}`}
          </text>
        </g>,
      )
    }
  }
  function onClick(event: React.MouseEvent<SVGSVGElement>) {
    const svgRect = event.currentTarget.getBoundingClientRect()
    const xClick = event.clientX - svgRect.left - margin.left
    const xVal = xScale.invert(xClick)
    if (
      filteredData[0].wavelength <= xVal &&
      xVal <= filteredData[filteredData.length - 1].wavelength
    ) {
      const yMatch = data.reduce((prev, curr) => {
        return Math.abs(curr.wavelength - xVal) < Math.abs(prev.wavelength - xVal) ? curr : prev
      })
      if (yMatch) {
        const newVal = {
          x: yMatch.wavelength, // Redefino xVal a la posicion mas cercana
          y: yMatch.intensity,
        }
        // Si el punto cliquieado esta ocupado se borra la linea que lo ocupa
        if (materialPoints.some((p) => p.x === newVal.x && p.y === newVal.y)) {
          setMaterialPoints(
            materialPoints.filter((point) => !(point.x === newVal.x && point.y === newVal.y)),
          )
          return
        }

        const newMaterialPoints = [...materialPoints]
        // Si no hay punto homologo borramos el punto de su ultima posicion antes de graficar
        if (materialPoints.length > lampPoints.length) {
          newMaterialPoints.pop()
        }
        setMaterialPoints([...newMaterialPoints, newVal])
      }
    }
  }

  return (
    <div ref={measureRef} style={{ height: `${height}px` }}>
      <svg width={width} height={height} onClick={onClick}>
        <title id="graphTitle">Lamp Spectrum</title>
        {spotsInGraph}
        <Group top={margin.top} left={margin.left}>
          <GridColumns scale={xScale} width={xMax} height={yMax} className="stroke-neutral-100" />
          <GridRows scale={yScale} width={xMax} height={yMax} className="stroke-neutral-100" />
          {filteredDatas.map((fd, index) => (
            <LinePath<SpectrumPoint>
              key={`material_line-${materials[index]}`}
              curve={curveLinear}
              data={fd}
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
          <AxisLeft scale={yScale} label="Intensity" />
        </Group>

        <Group top={margin.top} left={width - margin.right - 100}>
          {materials.map((m: string, index: number) => (
            <Group top={index * 20} key={`legend-item-${m}`}>
              <rect
                width={15}
                height={15}
                fill={materialsPalette[index % materialsPalette.length]}
              />
              <text x={20} y={12} fontSize={12} fill="black">
                {m}
              </text>
            </Group>
          ))}
        </Group>
      </svg>
    </div>
  )
}
