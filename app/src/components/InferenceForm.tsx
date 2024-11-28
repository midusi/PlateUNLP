import { useGlobalStore } from "@/hooks/use-global-store"
import { legendreAlgoritm, linearRegression } from "@/lib/utils"
import { useState } from "react"
import { InferenceBoxGraph } from "./InferenceBoxGraph"

interface InferenceOption {
    name: string
    function: (x: number[], y: number[]) => ((value: number) => number)
}

export interface Point {
    x: number
    y: number
}

const radioOptions: InferenceOption[] = [
    {
        name: "Linear regresion",
        function: linearRegression,
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

    const matches: {
        lamp: Point
        material: Point
    }[] = []
    const smallArr = lampPoints.length >= materialPoints.length ? materialPoints : lampPoints
    for (let i = 0; i < smallArr.length; i++) {
        matches.push({ lamp: lampPoints[i], material: materialPoints[i] })
    }

    function onChangeRadio(option: InferenceOption) {
        const inferenceFunction = option.function(
            matches.map(val => val.lamp.x),
            matches.map(val => val.material.x),
        )
        setPixelToWavelengthFunction(inferenceFunction)
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
            <InferenceBoxGraph />
        </>
    )
}
