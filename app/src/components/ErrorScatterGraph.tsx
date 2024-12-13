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

export function ErrorScatterGraph() {
    const [pixelToWavelengthFunction] = useGlobalStore(s => [
        s.pixelToWavelengthFunction,
    ])

    let content
    if (pixelToWavelengthFunction instanceof CustomError) {
        content = <></>
    }
    else {
        content = <></>
    }

    return (
        <svg >
            {content}
        </svg>
    )
}
