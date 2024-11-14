import type { JSX } from "react/jsx-runtime"
import { useGlobalStore } from "@/hooks/use-global-store"
import { useMeasure } from "@/hooks/use-measure"
import { linearRegression } from "@/lib/utils"
import { AxisBottom, AxisLeft } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { Circle, Line, LinePath } from "@visx/shape"
import * as d3 from "@visx/vendor/d3-array"
import { useMemo } from "react"

export interface EmpiricalSpectrumPoint {
    pixel: number
    intensity: number
}

export interface Point {
    x: number
    y: number
}

// data accessors
const getX = (p: Point) => p?.x ?? 0
const getY = (p: Point) => p?.y ?? 0

const height = 300
const margin = { top: 40, right: 30, bottom: 50, left: 55 }

export function Previewer({ data, color }: { data: EmpiricalSpectrumPoint[], color: string }) {
    const [lampPoints, materialPoints] = useGlobalStore(s => [
        s.lampPoints,
        s.materialPoints,
    ])

    const matches: {
        lamp: Point
        material: Point
    }[] = []
    const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
    for (let i = 0; i < smallArr.length; i++) {
        matches.push({ lamp: lampPoints[i], material: materialPoints[i] })
    }

    const excecuteRegression = linearRegression(
        matches.map(val => val.lamp.x),
        matches.map(val => val.material.x),
    )

    const regressionedData: Point[] = data.map((val, i) => {
        return {
            x: excecuteRegression(val.pixel),
            y: data[i].intensity,
        }
    })

    const { xScale, yScale } = useMemo(() => {
        return {
            regressionedData,
            xScale: scaleLinear<number>({ domain: [regressionedData[0].x, d3.max(regressionedData, getX)!] }),
            yScale: scaleLinear<number>({ domain: [0, d3.max(regressionedData, getY)!] }),
        }
    }, [regressionedData])

    // bounds
    const [measureRef, measured] = useMeasure<HTMLDivElement>()
    const width = measured.width ?? 0
    const xMax = Math.max(width - margin.left - margin.right, 0)
    const yMax = Math.max(height - margin.top - margin.bottom, 0)

    // update scale output ranges
    xScale.range([0, xMax])
    yScale.range([yMax, 0])

    return (
        <div ref={measureRef} className="bg-green-50">
            Preview
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
                    <LinePath<Point>
                        curve={curveLinear}
                        data={regressionedData}
                        x={p => xScale(getX(p)) ?? 0}
                        y={p => yScale(getY(p)) ?? 0}
                        shapeRendering="geometricPrecision"
                        className="stroke-1"
                        style={{ stroke: color }}
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
