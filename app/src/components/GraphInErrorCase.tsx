import { AxisBottom, AxisLeft } from "@visx/axis"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"

interface GraphInErrorCaseProps {
    message: string
    dimensions: { width: number, height: number }
    margin: { top: number, right: number, bottom: number, left: number }
}

export function GraphInErrorCase({ message, dimensions, margin }: GraphInErrorCaseProps) {
    const { width, height } = dimensions
    const xMax = Math.max(width - margin.left - margin.right, 0)
    const yMax = Math.max(height - margin.top - margin.bottom, 0)

    const boxPadding = 15
    const boxWidth = width * 0.6

    const lines = wrapText(message, boxWidth - boxPadding)
    const indexedLines = lines.map((line, index) => ({ line, index }))

    const textHeight = 15
    const boxHeight = (lines.length + 1) * textHeight + boxPadding * 2
    return (
        <>
            <Group top={margin.top} left={margin.left}>
                <AxisBottom
                    top={yMax}
                    scale={scaleLinear<number>({ domain: [0, xMax] }).range([0, xMax])}
                    label="Pixel"
                    numTicks={Math.floor(xMax / 80)}
                />
                <AxisLeft
                    scale={scaleLinear<number>({ domain: [0, yMax] }).range([yMax, 0])}
                    label="Wavelength (Å)"
                />
            </Group>
            <g>
                <rect
                    x={(width - boxWidth) / 2}
                    y={((height - boxHeight) / 2)}
                    width={boxWidth}
                    height={boxHeight}
                    fill="lightyellow"
                    stroke="red"
                    rx={10} // Bordes redondeados
                />
                <text
                    x={((width - boxWidth) / 2) + boxPadding * 2}
                    y={((height - boxHeight) / 2) + boxPadding * 2}
                    textAnchor="middle" // Centra el texto horizontalmente
                    dominantBaseline="middle" // Centra el texto verticalmente
                    fontSize="16"
                    fill="red"
                >
                    {indexedLines.map((line, index) => (
                        <tspan
                            key={line.index}
                            x={width / 2} // Mantén el texto centrado horizontalmente
                            dy={index === 0 ? "0" : "1.2em"} // Espaciado vertical entre líneas
                        >
                            {line.line}
                        </tspan>
                    ))}
                </text>
            </g>
        </>
    )
}

function wrapText(text: string, maxWidth: number): string[] {
    // Función para dividir el texto en líneasa
    const words = text.split(" ")
    const lines: string[] = []
    let currentLine = ""

    words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        if (testLine.length * 8 > maxWidth) { // Aproximación: cada carácter ocupa ~8px
            lines.push(currentLine)
            currentLine = word
        }
        else {
            currentLine = testLine
        }
    })

    if (currentLine)
        lines.push(currentLine)
    return lines
};
