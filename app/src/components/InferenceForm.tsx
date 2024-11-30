import { useGlobalStore } from "@/hooks/use-global-store"
import { legendreAlgoritm, linearRegression, piecewiseLinearRegression } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"
import { InferenceBoxGraph } from "./InferenceBoxGraph"

interface InferenceOption {
    name: string
    function: (x: number[], y: number[]) => ((value: number) => number)
}

export interface Point {
    x: number
    y: number
}

interface Match {
    lamp: Point
    material: Point
}

const radioOptions: InferenceOption[] = [
    {
        name: "Linear regresion",
        function: linearRegression,
    },
    {
        name: "Piece wise linear regression",
        function: piecewiseLinearRegression, // Cambiar por legendreRegression
    },
    {
        name: "Legendre (8 coefficients)",
        function: legendreAlgoritm, // Cambiar por legendreRegression
    },
]

export function InferenceForm() {
    const [selectedOption, setSelectedOption] = useState<InferenceOption>(radioOptions[0])
    const [setPixelToWavelengthFunction, lampPoints, materialPoints] = useGlobalStore(s => [
        s.setPixelToWavelengthFunction,
        s.lampPoints,
        s.materialPoints,
    ])

    const matches: Match[] = useMemo((): Match[] => {
        const matches: Match[] = []
        const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
        for (let i = 0; i < smallArr.length; i++) {
            matches.push({ lamp: lampPoints[i], material: materialPoints[i] })
        }
        return matches
    }, [lampPoints, materialPoints])

    useEffect(() => {
        const inferenceFunction = selectedOption.function(
            matches.map(val => val.lamp.x),
            matches.map(val => val.material.x),
        )

        setPixelToWavelengthFunction(inferenceFunction)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matches, selectedOption]) // Dependencias relevantes

    function onChangeRadio(option: InferenceOption) {
        setSelectedOption(option)
    }

    return (
        <>
            <p>
                {radioOptions.map((option: InferenceOption) => (
                    <label key={option.name} style={{ display: "block", marginBottom: "8px" }}>
                        <input
                            type="radio"
                            name="inferenceMethod"
                            value={option.name}
                            checked={selectedOption.name === option.name}
                            onChange={() => onChangeRadio(option)}
                        />
                        {option.name}

                    </label>
                ))}
            </p>
            {matches.length >= 2 && <InferenceBoxGraph />}
        </>
    )
}
