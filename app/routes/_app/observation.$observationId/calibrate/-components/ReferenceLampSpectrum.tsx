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
import { linesPalette } from "~/lib/lines-palette"
import { materialsPalette } from "~/lib/materials-palette"
import type { SpectrumPoint } from "~/lib/spectral-data"

// data accessors
const getX = (p: SpectrumPoint) => p?.wavelength ?? 0
const getY = (p: SpectrumPoint) => p?.intensity ?? 0

const height = 200
const margin = { top: 6, right: 0, bottom: 40, left: 50 }

type ReferenceLampSpectrumProps = {
  minWavelength: number
  maxWavelength: number
  material: string
  materialArr: {
    wavelength: number
    material: string
    intensity: number
  }[]
  onlyOneLine: boolean
  lampPoints: { x: number; y: number }[]
  materialPoints: { x: number; y: number }[]
  setMaterialPoints: (arr: { x: number; y: number }[]) => void
}

export function ReferenceLampSpectrum({
  minWavelength,
  maxWavelength,
  material,
  materialArr,
  onlyOneLine,
  materialPoints,
  lampPoints,
  setMaterialPoints,
}: ReferenceLampSpectrumProps) {

  const { materialArrInRange, materialArrForLabel, xScale, yScale } = useMemo(() => {
    let min = 0
    while (getX(materialArr[min]) < minWavelength) min++
    let max = materialArr.length - 1
    while (getX(materialArr[max]) > maxWavelength) max--

    /** Arreglo de todos los registros que encajan en el rango seleccionado */
    const materialArrInRange = materialArr.slice(min, max + 1)

    /** Arreglo de intensidades de materiales separados por etiquetas */
    let materialArrForLabel
    if(onlyOneLine) {
      materialArrForLabel = [{
        label: material,
        arr: materialArrInRange
      }]
    } else {
      /** Listado de etiquetas encontradas en el arreglo de materiales */
      const labels = new Set(materialArr.map(ma => ma.material))
      /** Separar arreglo por etiqueta */
      materialArrForLabel = Array.from(labels)
        .map(label => ({
          label:label,
          arr: materialArrInRange.filter(p => p.material === label)
        }))
    }

    return {
      materialArrInRange,
      materialArrForLabel,
      xScale: scaleLinear<number>({
        domain: d3.extent(materialArrInRange, getX) as [number, number],
      }),
      yScale: scaleLinear<number>({ domain: [0, d3.max(materialArrInRange, getY)!] }),
    }
  }, [materialArr, minWavelength, maxWavelength, onlyOneLine, material])

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
      materialArrInRange.length > 0 &&
      materialArrInRange[0].wavelength <= point.x &&
      point.x <= materialArrInRange[materialArrInRange.length - 1].wavelength
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
      materialArrInRange[0].wavelength <= xVal &&
      xVal <= materialArrInRange[materialArrInRange.length - 1].wavelength
    ) {
      const yMatch = materialArr.reduce((prev, curr) => {
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
      {/** biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <svg width={width} height={height} onClick={onClick} role="img"
        aria-label="Lamp Spectrum">
        {spotsInGraph}
        <Group top={margin.top} left={margin.left}>
          <GridColumns scale={xScale} width={xMax} height={yMax} className="stroke-neutral-100" />
          <GridRows scale={yScale} width={xMax} height={yMax} className="stroke-neutral-100" />
          {materialArrForLabel.map((item, index) => (
            <LinePath<SpectrumPoint>
              key={`material_line-${item.label}`}
              curve={curveLinear}
              data={item.arr}
              x={(p) => xScale(getX(p))}
              y={(p) => yScale(getY(p))}
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
          {materialArrForLabel.map((item, index) => (
            <Group top={index * 20} key={`legend-item-${item.label}`}>
              <rect
                width={15}
                height={15}
                fill={materialsPalette[index % materialsPalette.length]}
              />
              <text x={20} y={12} fontSize={12} fill="black">
                {item.label}
              </text>
            </Group>
          ))}
        </Group>
      </svg>
    </div>
  )
}
