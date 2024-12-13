import { useGlobalStore } from "@/hooks/use-global-store"
import { CustomError, generateRange } from "@/lib/utils"
import { AxisBottom, AxisLeft } from "@visx/axis"
import { curveLinear } from "@visx/curve"
import { GridColumns, GridRows } from "@visx/grid"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { Circle, LinePath } from "@visx/shape"

import * as d3 from "@visx/vendor/d3-array"
import { useMemo } from "react"
import { GraphInErrorCase } from "./GraphInErrorCase"

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

const height = 400
const width = 400
const margin = { top: 40, right: 30, bottom: 50, left: 55 }
const xMax = Math.max(width - margin.left - margin.right, 0)
const yMax = Math.max(height - margin.top - margin.bottom, 0)

interface InferenceBoxComponentsProps {
    pixelToWavelengthFunction: (value: number) => number
}

function InferenceBoxComponents({ pixelToWavelengthFunction }: InferenceBoxComponentsProps) {
    const [lampPoints, materialPoints] = useGlobalStore(s => [
        s.lampPoints,
        s.materialPoints,
    ])

    const matches: Point[] = useMemo((): Point[] => {
        const matches: Point[] = []
        const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
        for (let i = 0; i < smallArr.length; i++) {
            matches.push({ x: lampPoints[i].x, y: materialPoints[i].x })
        }
        return matches
    }, [lampPoints, materialPoints])

    const functionValues: Point[] = useMemo((): Point[] => {
        let functionValues: Point[] = []
        const minV = Math.min(...matches.map(val => val.x), ...matches.map(val => val.x))
        const maxV = Math.max(...matches.map(val => val.x), ...matches.map(val => val.x))
        functionValues = generateRange(minV - 50, maxV + 50, 100).map((value) => {
            return {
                x: value,
                y: pixelToWavelengthFunction(value),
            }
        })
        return functionValues
    }, [matches, pixelToWavelengthFunction])

    const { xScale, yScale } = useMemo(() => {
        const xMin = Math.min(d3.min(matches, getX)!, d3.min(functionValues, getX)!)
        const xMax = Math.max(d3.max(matches, getX)!, d3.max(functionValues, getX)!)
        const yMin = Math.min(d3.min(matches, getY)!, d3.min(functionValues, getY)!)
        const yMax = Math.max(d3.max(matches, getY)!, d3.max(functionValues, getY)!)

        return {
            xScale: scaleLinear<number>({ domain: [xMin, xMax] }),
            yScale: scaleLinear<number>({ domain: [yMin, yMax] }),
        }
    }, [functionValues, matches])

    // update scale output ranges
    xScale.range([0, xMax])
    yScale.range([yMax, 0])

    const spotsInGraph = matches.map((match, index) => {
        const xPos = xScale(getX(match))
        const yPos = yScale(getY(match))

        if (!xPos || !yPos)
            return <g key={`InferenceBoxGraphGroup-${match.x}-${match.y}`}></g>

        return (
            <g key={`InferenceBoxGraphGroup-${match.x}-${match.y}`}>
                <Circle
                    cx={xPos}
                    cy={yPos}
                    stroke="grey"
                    r={3}
                />
                <text
                    x={xPos + 5} // Ajusta el desplazamiento horizontal del texto
                    y={yPos - 5} // Ajusta el desplazamiento vertical del texto
                    fontSize="12"
                    fontFamily="Arial, sans-serif"
                    fill="black" // Asegúrate de establecer un color de relleno
                >
                    #
                    {index}
                </text>
            </g>
        )
    })

    return (
        <Group top={margin.top} left={margin.left}>
            {spotsInGraph}
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
                data={functionValues}
                x={p => xScale(getX(p)) ?? 0}
                y={p => yScale(getY(p)) ?? 0}
                shapeRendering="geometricPrecision"
                className="stroke-1"
                style={{ stroke: "green" }}
            />
            <AxisBottom
                scale={xScale}
                top={yMax}
                label="Pixel"
                numTicks={Math.floor(xMax / 80)}
            />
            <AxisLeft scale={yScale} label="Wavelength (Å)" />
        </Group>
    )
}

export function InferenceBoxGraph() {
    const [pixelToWavelengthFunction] = useGlobalStore(s => [
        s.pixelToWavelengthFunction,
    ])

    let content
    if (pixelToWavelengthFunction instanceof CustomError) {
        content = (
            <GraphInErrorCase
                message={pixelToWavelengthFunction.message}
                dimensions={{ height, width }}
                margin={margin}
                labels={{ x: "Pixel", y: "Wavelength (Å)" }}
            />
        )
    }
    else {
        content = <InferenceBoxComponents pixelToWavelengthFunction={pixelToWavelengthFunction} />
    }

    return (
        <div className="w-full">
            <svg
                className="w-full h-auto"
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid meet"
            >
                {content}
            </svg>
        </div>
    )
}
