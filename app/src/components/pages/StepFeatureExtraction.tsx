import type { Point } from "@/interfaces/Point"
import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
import { findPlateau, findXspacedPoints, getPointsInRect, obtainimageMatrix, obtainImageSegments, promediadoHorizontal } from "@/lib/image"
import { extremePoints } from "@/lib/trigonometry"
import { linearRegression, splineCuadratic } from "@/lib/utils"
import { curveStep } from "@visx/curve"
import { ParentSize } from "@visx/responsive"
import { AnimatedAxis, AnimatedGrid, AnimatedLineSeries, darkTheme, XYChart } from "@visx/xychart"
import { Forward } from "lucide-react"
import { max, mean, min, round } from "mathjs"
import { useEffect, useRef, useState } from "react"
import { Button } from "../atoms/button"

export function StepFeatureExtraction({ index, processInfo, setProcessInfo }: StepProps) {
  const imageSrc = "/forTest/Science1.png"
  const checkpoints = 20
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
  const [pointsWMed, setPointsWMed] = useState<Point[]>([])
  const [rectMedium, setRectMedium] = useState<(x: number) => number>(() => (x: number) => x)
  const [rects, setRects] = useState<{ m: number, funct: ((x: number) => number) }[]>([])
  const [opening, setOpening] = useState<number>(0)
  const [avgsPerpendicularArr, setAvgsPerpendicularArr] = useState<number[]>([])

  useEffect(() => {
    // Obtener informacion de imagen
    obtainimageMatrix(imageSrc, false).then(({ data, width, height }) => {
      if (!data || data.length === 0)
        return
      setImageData({ data, width, height })

      // Segmentar la imagen
      const points = findXspacedPoints(width, checkpoints)
      const segmentsData = obtainImageSegments(data, width, height, points, segmentWidth)
      for (const sd of segmentsData) {
        if (sd.length !== segmentWidth * height * 4)
          console.warn("Segment size mismatch:", sd.length, segmentWidth * height * 4)
      }

      /**
       * Funciones de cada segmento promediado horizontalmente
       */
      const functions = segmentsData.map(data =>
        promediadoHorizontal(data, segmentWidth, height))

      // Obtener las medias de cada funcion
      const plateauInfo: {
        medium: number
        opening: number
      }[] = functions.map(funct => findPlateau(funct, 0.5))

      const pointsWhitMedias = points.map((point, index) => (
        { x: point, y: plateauInfo[index]?.medium ?? 0 }
      ))
      setPointsWMed(pointsWhitMedias)

      // Infiere funcion medio del espectro
      const splineCase = linearRegression(pointsWhitMedias.map(p => p.x), pointsWhitMedias.map(p => p.y)) // Version lineal
      // const splineCase = splineCuadratic(pointsWhitMedias.map(p => p.x), pointsWhitMedias.map(p => p.y))
      setRectMedium(() => splineCase)

      /**
       * Arreglo de funciones que para cada punto de la recta, dada una altura Y
       * indica el pixel X que le corresponde.
       */
      const perpendicularRects: {
        m: number
        point: Point
      }[] = []
      for (let i = 0; i < width - 1; i++) {
        const act = { x: i, y: splineCase(i) }
        const sig = { x: (i + 1), y: splineCase((i + 1)) }
        perpendicularRects.push({
          m: (sig.y - act.y) / (sig.x - act.x),
          point: act,
        })
      }

      const perpendicularFunctions: {
        m: number
        funct: ((h: number) => number)
      }[] = perpendicularRects.map((info) => {
        const p1 = info.point
        const m = -1 / info.m
        const b = p1.y - m * p1.x
        return {
          m,
          funct: (y: number) => ((y - b) / m),
        } // Para cada Y me da ele x que le corresponde
      })
      // Duplica el ultimo elemento
      perpendicularFunctions.push(perpendicularFunctions[perpendicularFunctions.length - 1])
      setRects(perpendicularFunctions)

      /**
       * Apertura promedio
       */
      const avgOpening = mean(plateauInfo.map(pi => pi.opening))
      setOpening(avgOpening)

      const avgsPerpendicular: number[] = []
      for (let i = 0; i < perpendicularFunctions.length; i++) {
        const point = { x: i, y: splineCase(i) }
        const { forward, backward } = extremePoints(
          point,
          perpendicularFunctions[i].m,
          avgOpening / 2,
        )

        const minY = round(min(forward.y, backward.y))
        const maxY = round(max(forward.y, backward.y))
        const values: number[] = getPointsInRect(data, width, perpendicularFunctions[i].funct, minY, maxY)

        if (values.length === 0)
          avgsPerpendicular.push(0)
        else
          avgsPerpendicular.push(mean(values))
      }
      setAvgsPerpendicularArr(avgsPerpendicular)
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
        <>
          <ImageWithDraws
            src={imageSrc}
            points={pointsWMed}
            drawFunction={rectMedium}
            perpendicularFunctions={rects}
            opening={opening}
          />
          <SimpleFunctionXY data={avgsPerpendicularArr} />
        </>
      )}
      <hr className="w-full mb-4"></hr>
      <Button onClick={() => onComplete()}>
        Save
      </Button>
    </div>
  )
}

interface ImageWithDrawsProps {
  src: string
  points: Point[]
  drawFunction?: ((x: number) => number)
  perpendicularFunctions: { m: number, funct: ((x: number) => number) }[]
  opening?: number
}

function ImageWithDraws({ src, points, drawFunction, perpendicularFunctions, opening }: ImageWithDrawsProps) {
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

      // Dibujar puntos si están definidos
      if (points) {
        ctx.fillStyle = "red"
        for (const point of points) {
          ctx.beginPath()
          ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

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

      // Dibujar rectas si está definidas
      if (perpendicularFunctions && drawFunction && opening) {
        for (let i = 0; i < perpendicularFunctions.length; i += 100) {
          const point = { x: i, y: drawFunction(i) }

          // // Punto central
          // ctx.fillStyle = "steelblue"
          // ctx.strokeStyle = "black" // borde negro
          // ctx.beginPath()
          // ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI)
          // ctx.fill()

          // const verticalRect = perpendicularFunctions[point.x].funct
          const m = perpendicularFunctions[point.x].m
          ctx.strokeStyle = "steelblue"
          ctx.lineWidth = 6
          ctx.beginPath()

          // Punto destino arriba y abajo
          const { forward: pdup, backward: pddown } = extremePoints(point, m, opening / 2)

          ctx.moveTo(pdup.x, pdup.y)
          ctx.lineTo(pddown.x, pddown.y)
          ctx.stroke()

          // // inicio y fin
          // ctx.fillStyle = "steelblue"
          // ctx.beginPath()
          // ctx.arc(pddown.x, pddown.y, 10, 0, 2 * Math.PI)
          // ctx.arc(pdup.x, pdup.y, 10, 0, 2 * Math.PI)
          // ctx.fill()
        }
      }
    }
    img.src = src
  }, [src, points, drawFunction, perpendicularFunctions, opening])

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
    <ParentSize>
      {({ width }) => (
        <XYChart
          theme={darkTheme}
          xScale={{ type: "linear" }}
          yScale={{ type: "linear" }}
          height={260}
          width={width}
          margin={{ top: 40, right: 0, bottom: 40, left: 0 }}
        >
          <AnimatedAxis orientation="bottom" />
          <AnimatedGrid columns={false} numTicks={4} />
          <AnimatedLineSeries curve={curveStep} dataKey="Line 1" data={data1} {...accessors} />
        </XYChart>
      )}
    </ParentSize>
  )
}
