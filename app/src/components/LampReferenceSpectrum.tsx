import { memo, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Brush,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import fileData from "../../generated/spectrums.json"

interface LampReferenceSpectrumProps {
  material: string
}

interface BrushRange {
  startIndex?: number
  endIndex?: number
}

interface Data {
  x: number
  y: number
  material: string
}

function extractMaterialSpectralData(material: string) {
  const materialList = material.split("-")
  const nistData = fileData.datasets.find(i => i.id === "nist")
  const materials = materialList.flatMap(m => [m, `${m} I`, `${m} II`])
  const data = nistData?.points
    .filter(i => materials.includes(i.material))
    .map((d) => { return { x: d.wavelength, y: d.intensity, material: d.material } }) || []

  // if (data.length === 0) {
  //   throw new Error("El arreglo de datos a mostrar esta vacio. data="+data);
  // }
  return data
}

function fillDataWithLinearInterpolation(data: Data[]) {
  const filledData = []
  const dist = 1// Distancia de rellenado

  for (let i = 0; i < data.length - 1; i++) {
    const currentPoint = data[i]
    const nextPoint = data[i + 1]

    // Añadir el punto actual al arreglo
    filledData.push(currentPoint)

    // Calcular la distancia entre puntos en x
    const xDiff = nextPoint.x - currentPoint.x

    // Si la distancia es mayor que 1, rellenar puntos
    if (xDiff > dist) {
      for (let x = currentPoint.x + dist; x < nextPoint.x; x++) {
        // Interpolación lineal para el valor de y
        const y = currentPoint.y + (x - currentPoint.x) * (nextPoint.y - currentPoint.y) / xDiff

        filledData.push({ x, y, material: "" })
      }
    }
  }

  // Añadir el último punto
  filledData.push(data[data.length - 1])

  return filledData
}

function binarySearch(arr: Data[], target: number, key: "x" | "y") {
  let low = 0
  let high = arr.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (arr[mid][key] < target) {
      low = mid + 1
    }
    else if (arr[mid][key] > target) {
      high = mid - 1
    }
    else {
      return mid // Si el valor exacto se encuentra
    }
  }
  return low // Si no se encuentra, devuelve el índice más cercano
}

interface LampReferenceBrushProps {
  data: Data[]
  setRange: React.Dispatch<React.SetStateAction<{ start: number, end: number }>>
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

function LampReferenceBrush({ data, setRange, xMin, xMax, yMin, yMax }: LampReferenceBrushProps) {
  const filledData = useMemo(() => {
    return fillDataWithLinearInterpolation(data)
  }, [data])

  function handleRangeChange(newRange: BrushRange) {
    if (newRange.startIndex !== undefined && newRange.endIndex !== undefined) {
      // console.log(newRange)
      setRange({
        start: filledData[newRange.startIndex].x,
        end: filledData[newRange.endIndex].x,
      })
    }
    else {
      throw new Error(`La variable newRange tiene valores sin definir. newRange=${newRange}`)
    }
  };

  return (
    <ComposedChart width={850} height={100} data={filledData}>
      <XAxis hide dataKey="x" />
      {" "}
      {/* Ocultamos el eje X */}
      <Brush
        data={filledData}
        dataKey="x"
        onChange={handleRangeChange}
        height={60}
        y={0}
        tickFormatter={x => Math.round(x).toString()}
        gap={10}
      >
        <AreaChart data={data}>
          <XAxis
            hide
            dataKey="x"
            domain={[xMin, xMax]}
            type="number"
            allowDataOverflow
          />
          <YAxis hide domain={[yMin, yMax]} />
          <Tooltip />
          <Area type="monotone" dataKey="y" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      </Brush>
    </ComposedChart>
  )
}

// Memorizar componente para evitar que se re-renderize a cada cambio de range
const LampReferenceBrushMemo = memo(LampReferenceBrush)

interface LampReferenceGraphProps {
  data: Data[]
  range: { start: number, end: number }
  yMin: number
  yMax: number
}

function LampReferenceGraph({ data, range, yMin, yMax }: LampReferenceGraphProps) {
  const startIndex = binarySearch(data, range.start, "x")
  const endIndex = binarySearch(data, range.end, "x")
  const filteredData = data.slice(startIndex, endIndex + 1)

  return (
    <AreaChart height={300} width={850} data={filteredData}>
      <defs>
        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis
        dataKey="x"
        label={{ value: "Wavelength (Å)", position: "bottom", offset: 0 }}
        domain={[range.start, range.end]}
        tickFormatter={x => Math.round(x).toString()}
        tickMargin={2}
        type="number"
        allowDataOverflow
      />
      <YAxis
        dataKey="y"
        label={{ value: "Intensity", angle: -90, position: "insideLeft" }}
        domain={[yMin, yMax]}
      />
      <Tooltip content={<CustomTooltip />} offset={50} />
      <Area
        type="monotone"
        dataKey="y"
        dot={false}
        stroke="#8884d8"
        fill="#8884d8"
        isAnimationActive={false}
      />
    </AreaChart>
  )
}

export default function LampReferenceSpectrum({ material }: LampReferenceSpectrumProps) {
  const { data, xMin, xMax, yMin, yMax } = useMemo(() => {
    const data = extractMaterialSpectralData(material)
    return {
      data,
      xMin: Math.min(...data.map(d => d.x)),
      xMax: Math.max(...data.map(d => d.x)),
      yMin: Math.min(...data.map(d => d.y)),
      yMax: Math.max(...data.map(d => d.y)),
    }
  }, [material])

  const [range, setRange] = useState({ start: data[0].x, end: data[data.length - 1].x })

  return (
    <>
      <LampReferenceBrushMemo
        data={data}
        setRange={setRange}
        xMax={xMax}
        xMin={xMin}
        yMax={yMax}
        yMin={yMin}
      />
      <LampReferenceGraph
        data={data}
        range={range}
        yMin={yMin}
        yMax={yMax}
      />
    </>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const { x, material } = payload[0].payload
    return (
      <div className="custom-tooltip bg-white p-2 border border-gray-300">
        <p>{`Wavelength (Å): ${x}`}</p>
        <p>{`Material: ${material}`}</p>
      </div>
    )
  }
}
