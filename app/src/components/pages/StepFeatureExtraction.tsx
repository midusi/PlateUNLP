import type { Point } from "@/interfaces/Point"
import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
import { findXspacedPoints, fitGaussian, matrixToUrl, obtainimageMatrix, obtainImageSegments, promediadoHorizontal } from "@/lib/image"
import { curveStep } from "@visx/curve"
import { AnimatedAxis, AnimatedGrid, AnimatedLineSeries, darkTheme, XYChart } from "@visx/xychart"
import { useEffect, useState } from "react"
import { Button } from "../atoms/button"

export function StepFeatureExtraction({ index, processInfo, setProcessInfo }: StepProps) {
  const imageSrc = "/forTest/Science1.png"
  const checkpoints = 3
  const segmentWidth = 120
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum,
  ])
  const [imageData, setImageData] = useState<Uint8ClampedArray<ArrayBufferLike> | null>(null)
  const [segmentsData, setSegmentsData] = useState<{
    data: Uint8ClampedArray<ArrayBufferLike>[]
    width: number
    height: number
  } | null>(null)
  const [avgFunctions, setAvgFunctions] = useState<number[][]>([])
  const [pointsWMed, setPointsWMed] = useState<Point[]>([])

  useEffect(() => {
    // Obtener informacion de imagen
    obtainimageMatrix(imageSrc, false).then(({ data, width, height }) => {
      if (!data)
        return
      setImageData(data)

      // Segmentar la imagen
      const points = findXspacedPoints(width, checkpoints)
      const segmentsData = obtainImageSegments(data, width, height, points, segmentWidth)
      for (const sd of segmentsData) {
        if (sd.length !== segmentWidth * height * 4)
          console.warn("Segment size mismatch:", sd.length, segmentWidth * height * 4)
      }
      setSegmentsData({ data: segmentsData, width: segmentWidth, height })

      // Obtener funciones de cada segmento
      const functions = segmentsData.map(data =>
        promediadoHorizontal(data, segmentWidth, height))
      setAvgFunctions(functions)

      // Obtener las medias de cada funcion
      const medias = functions.map(funct => fitGaussian(funct).mu)

      const pointsWhitMedias = points.map((point, index) => (
        { x: point, y: medias[index] }
      ))
      setPointsWMed(pointsWhitMedias)
    }).catch((err) => {
      console.error("Error loading Image Data:", err)
    })
  }, [imageSrc])

  function onComplete() {
    /// AGREGAR GUARDADO DE DATOS EXTRAIDOS

    /// Marca el paso actual como completado y el que le sigue como
    /// que necesita actualizaciones
    const generalTotal = processInfo.processingStatus.generalSteps.length
    setProcessInfo(prev => ({
      ...prev,
      processingStatus: {
        ...prev.processingStatus,
        specificSteps: prev.processingStatus.specificSteps.map((step, i) => (
          (i === (index - generalTotal)) // La etapa actual de selectedSpectrum se marca como completado
            ? {
                ...step,
                states: step.states!.map((state, j) => (
                  j === selectedSpectrum
                    ? "COMPLETE" as const
                    : state
                )),
              }
            : ((i === (index - generalTotal + 1))// Si hay otra etapa adelante se la marca como que necesita cambios
                ? {
                    ...step,
                    states: step.states!.map((state, j) => (
                      j === selectedSpectrum
                        ? "NECESSARY_CHANGES" as const
                        : state
                    )),
                  }
                : step // Cualquier otra etapa mantiene su informacion
              )
        )),
      },
    }))
    setActualStep(index + 1)
  }

  return (
    <div className="w-full p-6 flex flex-col items-center">
      <SimpleImage src={imageSrc} points={pointsWMed} />
      {segmentsData && (
        <div className="flex flex-col gap-6 bg-fuchsia-200 w-full  ">
          {segmentsData.data.map((data, index) => (
            <div key={data[0]} className="p-2 m-2 bg-red-300 flex flex-row items-start gap-4">
              <SimpleImage
                src={matrixToUrl(
                  data,
                  segmentsData.width,
                  segmentsData.height,
                )}
              />
              <SimpleFunctionXY data={avgFunctions[index]} />
            </div>
          ))}
        </div>
      )}
      <hr className="w-full mb-4"></hr>
      <Button onClick={() => onComplete()}>
        Save
      </Button>
    </div>
  )
}

interface SimpleImageProps {
  src: string
  points?: Point[]
}

function SimpleImage({ src, points }: SimpleImageProps) {
  const pointSize = 8

  return (
    <div className="relative w-full h-[300px] mb-2">
      <img
        src={src}
        alt="Feature Extraction Image wahit referenece points"
        className="w-full h-full object-contain"
      />
      {/* Puntos de referencia estáticos */}
      {points && points.map(point => (
        <div
          key={`${point.x}-${point.y}`}
          className="absolute rounded-full border-2 border-white"
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`,
            width: `${pointSize}px`,
            height: `${pointSize}px`,
            backgroundColor: "red",
            transform: "translate(-50%, -50%)",
          }}
        >
        </div>
      ))}
    </div>
  )
}

interface SimpleFunctionXYProps {
  data?: number[]
}
function SimpleFunctionXY({ data }: SimpleFunctionXYProps) {
  const data1 = data
    ? data.map((value, index) => ({ x: index, y: value }))
    : [{ x: 1, y: 50 }, { x: 2, y: 10 }, { x: 3, y: 20 }, { x: 4, y: 80 }, { x: 9, y: 1 }]

  const accessors = {
    xAccessor: (d: Point) => d.x,
    yAccessor: (d: Point) => d.y,
  }

  return (
    <XYChart
      theme={darkTheme}
      xScale={{ type: "linear" }}
      yScale={{ type: "linear" }}
      height={260}
    >
      <AnimatedAxis orientation="bottom" />
      <AnimatedGrid columns={false} numTicks={4} />
      <AnimatedLineSeries curve={curveStep} dataKey="Line 1" data={data1} {...accessors} />
    </XYChart>
  )
}
