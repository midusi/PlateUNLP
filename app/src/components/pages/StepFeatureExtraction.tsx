import type { Point } from "@/interfaces/Point"
import type { StepProps } from "@/interfaces/StepProps"
import { useGlobalStore } from "@/hooks/use-global-store"
import { findPlateau, findXspacedPoints, getPointsInRect, obtainimageMatrix, obtainImageSegments, promediadoHorizontal } from "@/lib/image"
import { extremePoints } from "@/lib/trigonometry"
import { linearRegression, splineCuadratic } from "@/lib/utils"
import { curveStep } from "@visx/curve"
import { ParentSize } from "@visx/responsive"
import { AnimatedAreaSeries, AnimatedAxis, AnimatedGrid, lightTheme, XYChart } from "@visx/xychart"
import { max, mean, min, round } from "mathjs"
import { useEffect, useState } from "react"
import { Button } from "../atoms/button"
import { ImageWithPixelExtraction } from "../organisms/ImageWithPixelExtraction"

export function StepFeatureExtraction({ index, processInfo, setProcessInfo }: StepProps) {
  const urlScience1 = "/forTest/Test1_Science1.png"
  const urlLamp1 = "/forTest/Test1_Lamp1.png"
  const urlLamp2 = "/forTest/Test1_Lamp2.png"
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

  // Para espectro de Lamp 1
  const [lamp1pointsMed, setLamp1pointsMed] = useState<Point[]>([])
  const [lamp1RectMedium, setLamp1RectMedium] = useState<(x: number) => number>(() => (x: number) => x)
  const [lamp1Rects, setLamp1Rects] = useState<{ m: number, funct: ((x: number) => number) }[]>([])
  const [lamp1AvgsPerpendicularArr, setLamp1AvgsPerpendicularArr] = useState<number[]>([])

  useEffect(() => {
    // Obtener informacion de imagen
    obtainimageMatrix(urlScience1, false).then(({ data, width, height }) => {
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
      // const { funct: interpolateFunct, derived } = splineCuadratic(pointsWhitMedias.map(p => p.x), pointsWhitMedias.map(p => p.y))
      setRectMedium(() => interpolateFunct)

      /**
       * Arreglo de funciones que para cada punto de la recta, dada una altura Y
       * indica el pixel X que le corresponde.
       */
      const perpendicularFunctions: {
        m: number
        funct: ((h: number) => number)
      }[] = []
      for (let i = 0; i < width; i++) {
        const p1 = { x: i, y: interpolateFunct(i) }
        const m_perp = -1 / derived(i)
        const b = p1.y - m_perp * p1.x
        perpendicularFunctions.push({
          m: m_perp,
          funct: (y: number) => ((y - b) / m_perp), // Para cada Y me da ele x que le corresponde.
        })
      }
      setRects(perpendicularFunctions)

      /**
       * Apertura promedio
       */
      const avgOpening = mean(plateauInfo.map(pi => pi.opening))
      setOpening(avgOpening)

      /**
       * Promedio de pixeles perpendiculares a la pendiente para cada pixel horizontal.
       */
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

      // Lampara 1 datos relevantes.
      // Obtener informacion de imagen de Lamp1
      obtainimageMatrix(urlLamp1, false).then((lamp1) => {
        /**
         * Relacion de escala de dlampara 1 respecto al espectro de ciencia.
         * valorLamp1 * scaleLamp1 === equivalenteScience1
         */
        const scaleLamp1 = width / lamp1.width

        const valuesX = pointsWhitMedias.map(p => p.x)
        const valuesY = pointsWhitMedias.map(p => p.y)

        const scaledValuesX = valuesX.map(val => val * scaleLamp1)
        const scaledValuesY = valuesY.map(val => val * scaleLamp1)

        /** Puntos medios del espectro de lampara 1. */
        const lamp1points = scaledValuesX.map((x, idx) => ({ x, y: scaledValuesY[idx] }))
        setLamp1pointsMed(lamp1points)

        /**
         * Funcion media para Lampara 1, siempre da lo mismo que la del espectro de
         * ciencia pero lo escala a la relacion de lamp1.
         */
        const l1RectMedium = (x: number) => (interpolateFunct(x) * scaleLamp1)
        setLamp1RectMedium(() => l1RectMedium)

        /** Funciones perpendiculares para Lampara 1. */
        const lamp1PerpendicularFunctions: {
          m: number
          funct: ((h: number) => number)
        }[] = []
        for (let i = 0; i < lamp1.width; i++) {
          const p1 = { x: i, y: l1RectMedium(i) }
          const m_perp = -1 / derived(i) // Usa la deribada original, POSIBLE FUENTE DE ERROR
          const b = p1.y - m_perp * p1.x
          lamp1PerpendicularFunctions.push({
            m: m_perp,
            funct: (y: number) => ((y - b) / m_perp), // Para cada Y me da ele x que le corresponde.
          })
        }
        setLamp1Rects(lamp1PerpendicularFunctions)

        /**
         * Promedio de pixeles perpendiculares a la pendiente para cada pixel horizontal
         * de Lampara 1.
         */
        const avgsPerp: number[] = []
        for (let i = 0; i < lamp1PerpendicularFunctions.length; i++) {
          const point = { x: i, y: l1RectMedium(i) }
          const { forward, backward } = extremePoints(
            point,
            lamp1PerpendicularFunctions[i].m,
            avgOpening / 2,
          )

          const minY = round(min(forward.y, backward.y))
          const maxY = round(max(forward.y, backward.y))
          const values: number[] = getPointsInRect(
            lamp1.data,
            lamp1.width,
            lamp1PerpendicularFunctions[i].funct,
            minY,
            maxY,
          )

          if (values.length === 0)
            avgsPerp.push(0)
          else
            avgsPerp.push(mean(values))
        }
        setLamp1AvgsPerpendicularArr(avgsPerp)
      }).catch((err) => {
        console.error("Error loading Image Data:", err)
      })
    }).catch((err) => {
      console.error("Error loading Image Data:", err)
    })
  }, [urlScience1])

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
        <div className="flex flex-col gap-4">
          <ImageWithPixelExtraction
            title="Science Spectrum"
            imageUrl={urlScience1}
            imageAlt="Pixel-by-pixel analysis of science spectrum to extract spectrum function."
            pointsWMed={pointsWMed}
            drawFunction={rectMedium}
            perpendicularFunctions={rects}
            opening={opening}
          >
            <SimpleFunctionXY data={avgsPerpendicularArr} />
          </ImageWithPixelExtraction>

          <ImageWithPixelExtraction
            title="Lamp 1 Spectrum"
            imageUrl={urlLamp1}
            imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 1."
            pointsWMed={lamp1pointsMed}
            drawFunction={lamp1RectMedium}
            perpendicularFunctions={lamp1Rects}
            opening={opening}
          >
            <SimpleFunctionXY data={lamp1AvgsPerpendicularArr} />
          </ImageWithPixelExtraction>

        </div>
      )}
      <hr className="w-full mb-4"></hr>
      <Button onClick={() => onComplete()}>
        Save
      </Button>
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
    <ParentSize>
      {({ width }) => {
        if (width === 0)
          return null // Esperar a que se mida
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
              tickFormat={d => `${d}`}
              numTicks={5}
            />
            <AnimatedAxis
              orientation="left"
              tickFormat={d => `${d}`}
              numTicks={5}
            />
            <AnimatedGrid numTicks={10} />
            <AnimatedAreaSeries
              curve={curveStep}
              dataKey="Line 1"
              data={data1}
              fill="#60a5fa" // Color del área
              fillOpacity={0.3} // Transparencia
              stroke="#3b82f6" // Color del borde (línea superior)
              {...accessors}
            />
          </XYChart>
        )
      }}
    </ParentSize>
  )
}
