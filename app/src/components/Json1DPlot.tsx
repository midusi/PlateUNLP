import { useMeasure } from "@/hooks/use-measure";
import { Group } from "@visx/group";
import { GridColumns, GridRows } from "@visx/grid";
import { scaleLinear } from "@visx/scale";
import * as d3 from "@visx/vendor/d3-array";
import { LinePath } from "@visx/shape";
import { curveLinear } from "@visx/curve";
import { AxisBottom, AxisLeft } from "@visx/axis";

interface Json1DPlotProps {
  data: [SpectrumPoint]
}

interface SpectrumPoint {
  pixel: number,
  intensity: number
}

// data accessors
const getX = (p: SpectrumPoint) => p?.pixel ?? 0;
const getY = (p: SpectrumPoint) => p?.intensity ?? 0;

const height = 300;
const margin = { top: 40, right: 30, bottom: 50, left: 55 };

export default function Json1DPlot({ data }: Json1DPlotProps) {

  console.log(data)

  const xScale = scaleLinear<number>({
    domain: d3.extent(data, getX) as [number, number]
  })
  const yScale = scaleLinear<number>({ domain: [0, d3.max(data, getY)!] })

  // bounds
  const [measureRef, measured] = useMeasure<HTMLDivElement>();
  const width = measured.width ?? 0;
  const xMax = Math.max(width - margin.left - margin.right, 0);
  const yMax = Math.max(height - margin.top - margin.bottom, 0);

  return (
    <div ref={measureRef}>
      <svg width={width} height={height}>
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
            data={data}
            x={(p) => xScale(getX(p)) ?? 0}
            y={(p) => yScale(getY(p)) ?? 0}
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
