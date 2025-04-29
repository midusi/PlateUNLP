import type { Point } from "@/interfaces/Point"
import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
import { findPlateau, findXspacedPoints, getPointsInRect, obtainimageMatrix, obtainImageSegments, promediadoHorizontal } from "@/lib/image"
import { extremePoints } from "@/lib/trigonometry"
import { linearRegression, splineCuadratic } from "@/lib/utils"
import { curveStep } from "@visx/curve"
import { ParentSize } from "@visx/responsive"
import { AnimatedAreaSeries, AnimatedAxis, AnimatedGrid, AnimatedLineSeries, darkTheme, lightTheme, XYChart } from "@visx/xychart"
import { Forward } from "lucide-react"
import { max, mean, min, round } from "mathjs"
import { useEffect, useRef, useState } from "react"
import { Button } from "../atoms/button"
import { ImageWithPixelExtraction } from "../organisms/ImageWithPixelExtraction"

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
      const { funct: interpolateFunct, derived } = linearRegression(pointsWhitMedias.map(p => p.x), pointsWhitMedias.map(p => p.y)) // Version lineal
      //const { funct: interpolateFunct, derived } = splineCuadratic(pointsWhitMedias.map(p => p.x), pointsWhitMedias.map(p => p.y))
      setRectMedium(() => interpolateFunct)

      /**
       * Arreglo con informacion de la pendiente que le corresponde a cada punto de la funcion.
       */
      const perpendicularRects: {
        m: number
        point: Point
      }[] = []
      for (let i = 0; i < width; i++) {
        const act = { x: i, y: interpolateFunct(i) }
        perpendicularRects.push({
          m: derived(i),
          point: act,
        })
      }

      /**
       * Arreglo de funciones que para cada punto de la recta, dada una altura Y
       * indica el pixel X que le corresponde.
       */
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
      setRects(perpendicularFunctions)

      /**
       * Apertura promedio
       */
      const avgOpening = mean(plateauInfo.map(pi => pi.opening))
      setOpening(avgOpening)

      const avgsPerpendicular: number[] = []
      for (let i = 0; i < perpendicularFunctions.length; i++) {
        const point = { x: i, y: interpolateFunct(i) }
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
          <ImageWithPixelExtraction
            title="Science Spectrum"
            imageUrl={imageSrc}
            imageAlt="Pixel-by-pixel analysis of science spectrum to extract spectrum function"
            pointsWMed={pointsWMed}
            drawFunction={rectMedium}
            perpendicularFunctions={rects}
            opening={opening}
          >
            <SimpleFunctionXY data={avgsPerpendicularArr} />
          </ImageWithPixelExtraction>

        </>
      )
      }
      <hr className="w-full mb-4"></hr>
      <Button onClick={() => onComplete()}>
        Save
      </Button>
    </div >
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
      {({ width }) => {
        if (width === 0) return null; // Esperar a que se mida
        return (
          <XYChart
            theme={lightTheme}
            xScale={{ type: "linear" }}
            yScale={{ type: "linear" }}
            height={200}
            width={width}
            margin={{ top: 0, right: 32, bottom: 20, left: 32 }}
          >
            <AnimatedAxis
              orientation="bottom"
              tickFormat={(d) => `${d}`}
              numTicks={5}
            />
            <AnimatedAxis
              orientation="left"
              tickFormat={(d) => `${d}`}
              numTicks={5}
            />
            <AnimatedGrid columns={true} numTicks={10} />
            <AnimatedAreaSeries
              curve={curveStep}
              dataKey="Line 1"
              data={data1}
              fill="#60a5fa"       // Color del área
              fillOpacity={0.3}    // Transparencia
              stroke="#3b82f6"     // Color del borde (línea superior)
              {...accessors}
            />
          </XYChart>
        )
      }}
    </ParentSize >
  )
}
