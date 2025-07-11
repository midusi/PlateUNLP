import { curveStep } from "@visx/curve"
import { ParentSize } from "@visx/responsive"
import { AreaSeries, Axis, Grid, lightTheme, XYChart } from "@visx/xychart"

interface Point {
  x: number
  y: number
}

interface SimpleFunctionXYProps {
  data?: number[]
}

export function SimpleFunctionXY({ data }: SimpleFunctionXYProps) {
  const data1 = data
    ? data.map((value, index) => ({ x: index, y: value }))
    : [
        { x: 1, y: 50 },
        { x: 2, y: 10 },
        { x: 3, y: 20 },
        { x: 4, y: 80 },
        { x: 9, y: 1 },
      ]

  const accessors = {
    xAccessor: (d: Point) => d.x,
    yAccessor: (d: Point) => d.y,
  }

  return (
    <ParentSize>
      {({ width }) => {
        if (width === 0) return null // Esperar a que se mida
        return (
          <XYChart
            theme={lightTheme}
            xScale={{ type: "linear" }}
            yScale={{ type: "linear" }}
            height={200}
            width={width}
            margin={{ top: 0, right: 32, bottom: 20, left: 32 }}
          >
            <Axis
              orientation="bottom"
              tickFormat={(d) => `${d}`}
              numTicks={5}
            />
            <Axis orientation="left" tickFormat={(d) => `${d}`} numTicks={5} />
            <Grid numTicks={10} />
            <AreaSeries
              curve={curveStep}
              dataKey="Line 1"
              data={data1}
              fill="#60a5fa" // Color del área
              fillOpacity={0.3} // Transparencia
              stroke="#3b82f6" // Color del borde (línea superior)
              {...accessors}
            />
          </XYChart>
        )
      }}
    </ParentSize>
  )
}
