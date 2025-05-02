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
  const countCheckpoints = 10
  const segmentWidth = 120
  const [setActualStep, selectedSpectrum] = useGlobalStore(s => [
    s.setActualStep,
    s.selectedSpectrum,
  ])

  const { 
    scienceInfo,
    scienceMediasPoints,
    scienceAvgOpening,
    scienceFunction,
    scienceTransversalFunctions,
    scienceTransversalAvgs,
    lamp1MediasPoints,
    lamp1AvgOpening,
    lamp1Function,
    lamp1TransversalFunctions,
    lamp1TransversalAvgs, 
  } = useExtractFeatures(
    countCheckpoints,
    segmentWidth,
    urlScience1,
    urlLamp1,
  )

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
      {scienceInfo && (
        <div className="flex flex-col gap-4">
          <ImageWithPixelExtraction
            title="Science Spectrum"
            imageUrl={urlScience1}
            imageAlt="Pixel-by-pixel analysis of science spectrum to extract spectrum function."
            pointsWMed={scienceMediasPoints}
            drawFunction={scienceFunction!}
            perpendicularFunctions={scienceTransversalFunctions}
            opening={scienceAvgOpening}
          >
            <SimpleFunctionXY data={scienceTransversalAvgs} />
          </ImageWithPixelExtraction>

          <ImageWithPixelExtraction
            title="Lamp 1 Spectrum"
            imageUrl={urlLamp1}
            imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 1."
            pointsWMed={lamp1MediasPoints}
            drawFunction={lamp1Function!}
            perpendicularFunctions={lamp1TransversalFunctions}
            opening={lamp1AvgOpening}
          >
            <SimpleFunctionXY data={lamp1TransversalAvgs} />
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

interface useExtractFeaturesResponse {
  scienceInfo: {
    data: Uint8ClampedArray<ArrayBufferLike>
    width: number
    height: number
  } | null
  scienceMediasPoints: Point[]
  scienceAvgOpening: number
  scienceFunction: ((value: number) => number) | null
  scienceTransversalFunctions: {
    m: number
    funct: ((h: number) => number)
  }[]
  scienceTransversalAvgs: number[]
  lamp1MediasPoints: Point[]
  lamp1AvgOpening: number
  lamp1Function: ((value: number) => number) | null
  lamp1TransversalFunctions: {
    m: number
    funct: ((h: number) => number)
  }[]
  lamp1TransversalAvgs: number[]
}

function useExtractFeatures(
  countCheckpoints: number,
  segmentWidth: number,
  scienceUrl: string,
  lamp1Url: string,
): useExtractFeaturesResponse {
  /** Resultados a devolver */

  const [response, setResponse] = useState<useExtractFeaturesResponse>({
    scienceInfo: null,
    scienceMediasPoints: [],
    scienceAvgOpening: 0,
    scienceFunction: null,
    scienceTransversalFunctions: [],
    scienceTransversalAvgs: [],
    lamp1MediasPoints: [],
    lamp1AvgOpening: 0,
    lamp1Function: null,
    lamp1TransversalFunctions: [],
    lamp1TransversalAvgs: [],
  })

  useEffect(() => {
    const bag: useExtractFeaturesResponse = {... response}
    // Obtener informacion de imagen SCIENCE
    obtainimageMatrix(scienceUrl, false).then((science) => {
      if (!science.data || science.data.length === 0)
        return
      bag.scienceInfo = { data: science.data, width: science.width, height: science.height }

      // Segmentar la imagen
      /** Coordenadas X medias a lo largo de toda la imagen de SCIENCE */
      const sciencePoints = findXspacedPoints(science.width, countCheckpoints)
      /** Segmentos medios de imagen de SCIENCE */
      const segmentsData = obtainImageSegments(
        science.data,
        science.width,
        science.height,
        sciencePoints,
        segmentWidth,
      )
      for (const sd of segmentsData) {
        if (sd.length !== segmentWidth * science.height * 4)
          console.warn("Segment size mismatch:", sd.length, segmentWidth * science.height * 4)
      }

      /**
       * Funciones de cada segmento promediado horizontalmente
       * Osea, para cada pixel vertical se hace un avg de los pixeles
       * horizontales. x=>pixelVertical, y=>avgHorizontal
       */
      const scienceFunctions = segmentsData.map(data =>
        promediadoHorizontal(data, segmentWidth, science.height))

      /**
       * Arreglo con informacion de para cada funcion de un segmento el
       * punto vertical medio y la apartura que le corresponde.
       */
      const sciencePlateauInfo: {
        medium: number
        opening: number
      }[] = scienceFunctions.map(funct => findPlateau(funct, 0.5))

      /** Apertura promedio */
      const avgOpening = mean(sciencePlateauInfo.map(pi => pi.opening))
      bag.scienceAvgOpening = avgOpening

      /**
       * Conjuntos de cordenadas (x,y) de los puntos que trazan la recta
       * media de la función.
       */
      const scienceMediasPoints = sciencePoints.map((point, index) => (
        { x: point, y: sciencePlateauInfo[index]?.medium ?? 0 }
      ))
      bag.scienceMediasPoints = scienceMediasPoints

      // Infiere funcion medio del espectro
      const interpolated: {
        funct: ((x: number) => number)
        derived: ((x: number) => number)
      } = linearRegression(
        scienceMediasPoints.map(p => p.x),
        scienceMediasPoints.map(p => p.y),
      ) // Aproximación lineal
      // const { funct: interpolateFunct, derived } = splineCuadratic(
      //   pointsWhitMedias.map(p => p.x),
      //   pointsWhitMedias.map(p => p.y),
      // ) // Aproximación spline
      bag.scienceFunction = interpolated.funct

      /**
       * Arreglo de funciones que para cada punto de la recta, dada una altura Y
       * indica el pixel X que le corresponde.
       */
      const scienceTransversalFunctions: {
        m: number
        funct: ((h: number) => number)
      }[] = []
      for (let i = 0; i < science.width; i++) {
        const p1 = { x: i, y: interpolated.funct(i) }
        // // Perpendicular a la recta.
        // const m_perp = -1 / derived(i)
        // const b = p1.y - m_perp * p1.x
        // scienceTransversalFunctions.push({
        //   m: m_perp,
        //   funct: (y: number) => ((y - b) / m_perp), // Para cada Y me da ele x que le corresponde.
        // })
        // Perpendicular a la imagen.
        scienceTransversalFunctions.push({
          m: Infinity,
          funct: (_y: number) => (p1.x), // Para cada Y me da ele x que le corresponde.
          // En el caso Vertical siempre va a ser el X del punto.
        })
      }
      bag.scienceTransversalFunctions = scienceTransversalFunctions

      /** Promedio de pixeles que pasan por cada scienceTransversalFunction. */
      const scienceTransversalAvgs: number[] = []
      for (let i = 0; i < scienceTransversalFunctions.length; i++) {
        const point = { x: i, y: interpolated.funct(i) }
        /** Punnto inicial y final a considerar para promediado consiiderando la apertura */
        const { forward, backward } = extremePoints(
          point,
          scienceTransversalFunctions[i].m,
          avgOpening / 2,
        )

        /** Punto minimo de la recta en Y */
        const minY = round(min(forward.y, backward.y))
        /** Punto maximo de la recta en Y */
        const maxY = round(max(forward.y, backward.y))
        /** Valor numerico de todos los puntos por los que pasa la recta */
        const values: number[] = getPointsInRect(
          science.data,
          science.width,
          scienceTransversalFunctions[i].funct,
          minY,
          maxY,
        )

        // si no hay valores entonces devuelve 0
        if (values.length === 0)
          scienceTransversalAvgs.push(0)
        else
          scienceTransversalAvgs.push(mean(values))
      }
      bag.scienceTransversalAvgs = scienceTransversalAvgs

      // Lampara 1 datos relevantes.
      // Obtener informacion de imagen de Lamp1
      obtainimageMatrix(lamp1Url, false).then((lamp1) => {
      /**
       * Relacion de escala de dlampara 1 respecto al espectro de ciencia.
       * valorLamp1 * scaleLamp1 === equivalenteScience1
       */
        const scaleLamp1 = {
          x: science.width / lamp1.width,
          y: science.height / lamp1.height,
        }

        /**
         * Puntos medios del espectro de lampara 1.
         * Calculados escalando los puntos del espectro de ciencia.
         */
        const lamp1MediasPoints = bag.scienceMediasPoints.map(({ x, y }) => ({
          x: round(x * scaleLamp1.x),
          y: y * scaleLamp1.y,
        }))
        bag.lamp1MediasPoints = lamp1MediasPoints

        /** Apertura promedio de lampara 1*/
        bag.lamp1AvgOpening = bag.scienceAvgOpening

        /**
         * Funcion media para Lampara 1, siempre da lo mismo que la del espectro de
         * ciencia pero lo escala a la relacion de lamp1.
         */
        const lamp1Function = (x: number) => (
          bag.scienceFunction!(round(x * scaleLamp1.x)) * scaleLamp1.y
        )
        bag.lamp1Function = lamp1Function

        /** Funciones perpendiculares para Lampara 1. */
        const lamp1TransversalFunctions: {
          m: number
          funct: ((h: number) => number)
        }[] = []
        for (let i = 0; i < lamp1.width; i++) {
          const p1 = { x: i, y: lamp1Function(i) }
          const m_perp = -1 / interpolated.derived(p1.x)
          const b = p1.y - m_perp * p1.x
          lamp1TransversalFunctions.push({
            m: m_perp,
            funct: (y: number) => ((y - b) / m_perp), // Para cada Y me da ele x que le corresponde.
          })
        }
        bag.lamp1TransversalFunctions = lamp1TransversalFunctions

        /** Promedio de pixeles que pasan por cada lamp1TransversalFunction. */
        const scienceTransversalAvgs: number[] = []
        for (let i = 0; i < lamp1TransversalFunctions.length; i++) {
          const point = { x: i, y: lamp1Function(i) }
          const { forward, backward } = extremePoints(
            point,
            lamp1TransversalFunctions[i].m,
            avgOpening / 2,
          )

          const minY = round(min(forward.y, backward.y))
          const maxY = round(max(forward.y, backward.y))
          const values: number[] = getPointsInRect(
            lamp1.data,
            lamp1.width,
            lamp1TransversalFunctions[i].funct,
            minY,
            maxY,
          )

          if (values.length === 0)
            scienceTransversalAvgs.push(0)
          else
            scienceTransversalAvgs.push(mean(values))
        }
        bag.lamp1TransversalAvgs = scienceTransversalAvgs

        setResponse(bag)
      }).catch((err) => {
        console.error("Error loading Image Data:", err)
      })
    }).catch((err) => {
      console.error("Error loading Image Data:", err)
    })
  }, [scienceUrl])

  return response
}
