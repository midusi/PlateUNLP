import type { Point } from "@/interfaces/Point"
import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
import { AnimatedAxis, AnimatedGrid, AnimatedLineSeries, darkTheme, XYChart } from "@visx/xychart"
import { Button } from "../atoms/button"
import { findXspacedPoints, matrixToUrl, obtainimageMatrix, obtainImageSegments } from "@/lib/image"
import { useEffect, useState } from "react"

export function StepFeatureExtraction({ index, processInfo, setProcessInfo }: StepProps) {
  const imageSrc = "/forTest/Lamp1.png"
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum,
  ])
  const [imageData, setImageData] = useState<Uint8ClampedArray<ArrayBufferLike> | null>(null)
  const [segmentsData, setSegmentsData] = useState<{
    data: Uint8ClampedArray<ArrayBufferLike>[],
    width: number,
    height: number
  } | null>(null)
  useEffect(() => {
    obtainimageMatrix(imageSrc, true).then(({ data, width, height }) => {
      if (!data) return
      setImageData(data)
      const points = findXspacedPoints(width, 3)
      const segmentWidth = 10
      const segmentsData = obtainImageSegments(data, width, height, points, segmentWidth)
      for (let sd in segmentsData) {
        if (sd.length !== segmentWidth * height * 4)
          console.warn("Segment size mismatch:", sd.length, segmentWidth * height * 4);
      }
      setSegmentsData({ data: segmentsData, width: segmentWidth, height })
    }).catch(err => {
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
      <SimpleImage src={imageSrc} />
      {segmentsData && <div className="p-2 bg-slate-200">
        {segmentsData.data.map(data => (
          <div key={data[0]} className="p-2 m-2 bg-red-300">
            <SimpleImage src={matrixToUrl(
              data,
              segmentsData.width,
              segmentsData.height
            )} />
          </div>
        ))}
      </div>}
      <SimpleFunctionXY />
      <hr className="w-full mb-4"></hr>
      <Button onClick={() => onComplete()}>
        Save
      </Button>
    </div>
  )
}

function SimpleImage({ src }: { src: string }) {
  return (
    <div className="relative w-full h-[300px] mb-6">
      <img
        src={src}
        alt="Feature Extraction Image"
      />
    </div>
  )
}

function SimpleFunctionXY() {
  const data1 = [
    { x: 1, y: 50 },
    { x: 2, y: 10 },
    { x: 3, y: 20 },
    { x: 4, y: 80 },
    { x: 9, y: 1 },
  ]

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
      <AnimatedLineSeries dataKey="Line 1" data={data1} {...accessors} />
    </XYChart>
  )
}
