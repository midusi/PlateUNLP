import type { Point } from "@/interfaces/Point"
import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
import { findPlateau, findXspacedPoints, matrixToUrl, obtainimageMatrix, obtainImageSegments, promediadoHorizontal } from "@/lib/image"
import { linearRegression, splineCuadratic } from "@/lib/utils"
import { curveStep } from "@visx/curve"
import { AnimatedAxis, AnimatedGrid, AnimatedLineSeries, darkTheme, XYChart } from "@visx/xychart"
import { useEffect, useRef, useState } from "react"
import { Button } from "../atoms/button"

export function StepFeatureExtraction({ index, processInfo, setProcessInfo }: StepProps) {
  const imageSrc = "/forTest/Science1.png"
  const checkpoints = 10
  const segmentWidth = 120
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum,
  ])
  const [imageData, setImageData] = useState<{
    data: Uint8ClampedArray<ArrayBufferLike>
    width: number
    height: number
  } | null>(null)
  const [segmentsData, setSegmentsData] = useState<{
    data: Uint8ClampedArray<ArrayBufferLike>[]
    width: number
    height: number
  } | null>(null)
  const [avgFunctions, setAvgFunctions] = useState<number[][]>([])
  const [pointsWMed, setPointsWMed] = useState<Point[]>([])
  const [perpendicularRects, setPerpendicularRects] = useState<{m: number,large: number}[]>([])

  useEffect(() => {
    // Obtener informacion de imagen
    obtainimageMatrix(imageSrc, false).then(({ data, width, height }) => {
      if (!data)
        return
      setImageData({ data, width, height })

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
      const plateauInfo:{
        medium:number, 
        opening: number
      }[] = functions.map((funct) => findPlateau(funct, 0.5))

      const pointsWhitMedias = points.map((point, index) => (
        { x: point, y: plateauInfo[index].medium }
      ))
      setPointsWMed(pointsWhitMedias)

      const perpendicularRects:{
        m: number,
        large: number
      }[] = []
      for (let i=0; i<pointsWhitMedias.length-1; i++){
        const act = pointsWhitMedias[i]
        const sig = pointsWhitMedias[i+1]
        perpendicularRects.push({
          m:(sig.y-act.y)/(sig.x-act.x),
          large: plateauInfo[i].opening
        })
      }
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
      {imageData && (
        <SimpleImage
          src={imageSrc}
          points={pointsWMed}
          drawFunction={splineCuadratic(pointsWMed.map(p => p.x), pointsWMed.map(p => p.y))}
        />
      )}
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
  drawFunction?: (x: number) => number
}

function SimpleImage({ src, points, drawFunction }: SimpleImageProps) {
  const pointSize = 8

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas)
      return
    const ctx = canvas.getContext("2d")
    if (!ctx)
      return
    const img = new Image()
    img.onload = function () {
      canvas.width = img.width
      canvas.height = img.height

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      // Dibujar función si está definida
      if (drawFunction) {
        ctx.strokeStyle = "red"
        ctx.lineWidth = 4
        ctx.beginPath()
        for (let x = 0; x < canvas.width; x++) {
          const y = drawFunction(x)
          if (x === 0) {
            ctx.moveTo(x, y)
          }
          else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      // Dibujar puntos si están definidos
      if (points) {
        ctx.fillStyle = "red"
        for (const point of points) {
          ctx.beginPath()
          ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
    }
    img.src = src
  }, [src, points, drawFunction])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: "100%", height: "auto", display: "block" }}
    />
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
