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

const height = 200
const width = 400
const margin = { top: 40, right: 30, bottom: 50, left: 55 }

export function ErrorScatterGraph() {
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
                labels={{ x: "Wavelength (Å)", y: "Dispersion error" }}
            />
        )
    }
    else {
        content = <></>
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
