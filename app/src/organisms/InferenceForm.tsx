import { useGlobalStore } from "@/hooks/use-global-store"
import { CustomError, legendreAlgoritm, linearRegression, piecewiseLinearRegression } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"
import { ErrorScatterGraph } from "../molecules/ErrorScatterGraph"
import { InferenceBoxGraph } from "../molecules/InferenceBoxGraph"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../atoms/card"

interface InferenceOption {
    id: number
    name: string
    function: ((x: number[], y: number[], degree?: number) => ((value: number) => number))
    needDegree: boolean
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
        id: 0,
        name: "Linear regresion",
        function: linearRegression,
        needDegree: false,
    },
    {
        id: 1,
        name: "Piece wise linear regression",
        function: piecewiseLinearRegression,
        needDegree: false,
    },
    {
        id: 2,
        name: "Legendre",
        function: legendreAlgoritm,
        needDegree: true,
    },
]

export function InferenceForm() {
    const [selectedOption, setSelectedOption] = useState<InferenceOption>(radioOptions[0])
    const [degree, setDegree] = useState<number | string>(3)
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
        try {
            const inferenceFunction = selectedOption.function(
                matches.map(val => val.lamp.x),
                matches.map(val => val.material.x),
                selectedOption.needDegree ? Number(degree) : undefined,
            )
            setPixelToWavelengthFunction(inferenceFunction)
        }
        catch (error) {
            if (error instanceof CustomError) {
                setPixelToWavelengthFunction(error)
            }
            else {
                throw error
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matches, selectedOption, degree])

    function onChangeRadio(option: InferenceOption) {
        setSelectedOption(option)
    }

    function onChangeDegree(event: React.ChangeEvent<HTMLInputElement>) {
        const value = event.target.value
        if (value === "") {
            setDegree(value)
        }
        else if (/^\d{1,2}$/.test(value)) {
            const numericValue = Number.parseInt(value, 10)
            if (numericValue > 0) {
                setDegree(numericValue)
            }
        }
    }

    return (
        <Card className="m-2">
            <CardHeader>
                <CardTitle>Inference function fit</CardTitle>
                <CardDescription>
                    Fill in the details of the function for wavelength inference.
                </CardDescription>
            </CardHeader>
            <CardContent>
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
                            {option.needDegree && (
                                <input
                                    type="number"
                                    id="degreeInput"
                                    className="ml-4 border"
                                    style={{
                                        width: "3em",
                                        textAlign: "center",
                                        appearance: "auto",
                                        backgroundColor: "#e0f7fa",
                                    }}
                                    maxLength={2}
                                    value={degree}
                                    onChange={onChangeDegree}
                                    min={1}
                                    max={99}
                                    step={1}
                                />
                            )}
                        </label>
                    ))}
                </p>
                <InferenceBoxGraph />
                <ErrorScatterGraph />
            </CardContent>
        </Card>
    )
}
