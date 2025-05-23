import { Point } from "@/interfaces/Point"
import { findPlateau, findXspacedPoints, getPointsInRect, obtainimageMatrix, obtainImageSegments, promediadoHorizontal } from "@/lib/image"
import { extremePoints } from "@/lib/trigonometry"
import { linearRegressionWhitDerived, splineCuadratic } from "@/lib/utils"
import { max, mean, min, round } from "mathjs"
import { Dispatch, SetStateAction, useEffect, useState } from "react"

export interface useExtractFeaturesResponse {
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
  lamp2MediasPoints: Point[]
  lamp2AvgOpening: number
  lamp2Function: ((value: number) => number) | null
  lamp2TransversalFunctions: {
    m: number
    funct: ((h: number) => number)
  }[]
  lamp2TransversalAvgs: number[]
}

export function useExtractFeatures(
  countCheckpoints: number,
  segmentWidth: number,
  scienceUrl?: string,
  lamp1Url?: string,
  lamp2Url?: string,
  useSpline?: boolean,
  reuseScienceFunction?: boolean,
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
    lamp2MediasPoints: [],
    lamp2AvgOpening: 0,
    lamp2Function: null,
    lamp2TransversalFunctions: [],
    lamp2TransversalAvgs: [],
  })

  useEffect(() => {
    let bag: useExtractFeaturesResponse = {
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
      lamp2MediasPoints: [],
      lamp2AvgOpening: 0,
      lamp2Function: null,
      lamp2TransversalFunctions: [],
      lamp2TransversalAvgs: [],
    }
    if (!scienceUrl || !lamp1Url || !lamp2Url)
      return
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
      let interpolated: { funct: ((x: number) => number), derived: ((x: number) => number) }
      if (useSpline) { // Aproximación spline
        interpolated = splineCuadratic(
          scienceMediasPoints.map(p => p.x),
          scienceMediasPoints.map(p => p.y),
        )
      }
      else { // Aproximación lineal
        interpolated = linearRegressionWhitDerived(
          scienceMediasPoints.map(p => p.x),
          scienceMediasPoints.map(p => p.y),
        )
      }
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
        const lamp1Data = extractLampData({
          science: {
            ...science,
            mediasPoints: bag.scienceMediasPoints,
            avgOpening: bag.scienceAvgOpening,
            mediaFunction: bag.scienceFunction!,
          },
          lamp: lamp1,
          reuseScienceFunction,
          useSpline,
          countCheckpoints,
          segmentWidth,
        })

        // Actualizar salida del metodo con informacion de lamp1
        bag = {
          ...bag,
          lamp1MediasPoints: lamp1Data.mediasPoints,
          lamp1AvgOpening: lamp1Data.avgOpening,
          lamp1Function: lamp1Data.mediaFunction,
          lamp1TransversalFunctions: lamp1Data.transversalFunctions,
          lamp1TransversalAvgs: lamp1Data.transversalAvgs,
        }

        // Lampara 2 datos relevantes.
        // Obtener informacion de imagen de Lamp2
        // Las invocaciones tienen que ser anidadas por que sino
        // corremos riesgo de sobreescritura de variables entre hilos.
        obtainimageMatrix(lamp2Url, false).then((lamp2) => {
          const lamp2Data = extractLampData({
            science: {
              ...science,
              mediasPoints: bag.scienceMediasPoints,
              avgOpening: bag.scienceAvgOpening,
              mediaFunction: bag.scienceFunction!,
            },
            lamp: lamp2,
            reuseScienceFunction,
            useSpline,
            countCheckpoints,
            segmentWidth,
          })

          // Actualizar salida del metodo con informacion de lamp2
          bag = {
            ...bag,
            lamp2MediasPoints: lamp2Data.mediasPoints,
            lamp2AvgOpening: lamp2Data.avgOpening,
            lamp2Function: lamp2Data.mediaFunction,
            lamp2TransversalFunctions: lamp2Data.transversalFunctions,
            lamp2TransversalAvgs: lamp2Data.transversalAvgs,
          }

          setResponse(bag)
        }).catch((err) => {
          console.error("Error loading Image Data:", err)
        })
      }).catch((err) => {
        console.error("Error loading Image Data:", err)
      })
    }).catch((err) => {
      console.error("Error loading Image Data:", err)
    })
  }, [countCheckpoints, lamp1Url, lamp2Url, reuseScienceFunction, scienceUrl, segmentWidth, useSpline])

  return response
}

interface extractLampDataProps {
  science: {
    data: Uint8ClampedArray
    width: number
    height: number
    mediasPoints: Point[]
    avgOpening: number
    mediaFunction: ((value: number) => number)
  }
  lamp: {
    data: Uint8ClampedArray
    width: number
    height: number
  }
  reuseScienceFunction?: boolean
  useSpline?: boolean
  countCheckpoints?: number
  segmentWidth?: number
}

interface extractLampDataResponse {
  mediasPoints: Point[]
  avgOpening: number
  mediaFunction: ((value: number) => number) | null
  transversalFunctions: {
    m: number
    funct: ((h: number) => number)
  }[]
  transversalAvgs: number[]
}
function extractLampData({ science, lamp, reuseScienceFunction, useSpline, countCheckpoints, segmentWidth }: extractLampDataProps): extractLampDataResponse {
  const response: extractLampDataResponse = {
    mediasPoints: [],
    avgOpening: 0,
    mediaFunction: null,
    transversalFunctions: [],
    transversalAvgs: [],
  }
  /**
   * Relacion de escala de lampara respecto al espectro de ciencia.
   * valorLamp * scaleLamp === equivalenteScience
   */
  const scaleLamp = {
    x: science.width / lamp.width,
    y: science.height / lamp.height,
  }

  /**
   * Puntos medios del espectro de lampara.
   * Calculados escalando los puntos del espectro de ciencia.
   */
  let mediasPoints
  if (reuseScienceFunction) { // Reusar los del espectro de ciencia pero los escala.
    mediasPoints = science.mediasPoints.map(({ x, y }) => ({
      x: round(x * scaleLamp.x),
      y: y * scaleLamp.y,
    }))
  }
  else { // Infiere los suyos.
    const lampPoints = findXspacedPoints(science.width, countCheckpoints!)

    const segmentsData = obtainImageSegments(
      lamp.data,
      lamp.width,
      lamp.height,
      lampPoints,
      segmentWidth!,
    )
    const lampFunctions = segmentsData.map(data =>
      promediadoHorizontal(data, segmentWidth!, science.height))

    const lampPlateauInfo: {
      medium: number
      opening: number
    }[] = lampFunctions.map(funct => findPlateau(funct, 0.5))
    mediasPoints = lampPoints.map((point, index) => (
      { x: point, y: lampPlateauInfo[index]?.medium ?? 0 }
    ))
  }
  response.mediasPoints = mediasPoints

  /** Apertura promedio de lampara. Tomamos la misma que la del espectro */
  response.avgOpening = science.avgOpening

  /** Funcion media para Lampara */
  let mediaFunction: (value: number) => number
  if (reuseScienceFunction) { // Reusar la del espectro de ciencia pero lo escala.
    mediaFunction = (x: number) => (
      science.mediaFunction!(round(x * scaleLamp.x)) * scaleLamp.y
    )
  }
  else { // Infiere la suya en base a sus medias points
    if (useSpline) { // Aproximación spline
      mediaFunction = splineCuadratic(
        response.mediasPoints.map(p => p.x),
        response.mediasPoints.map(p => p.y),
      ).funct
    }
    else { // Aproximación lineal
      mediaFunction = linearRegressionWhitDerived(
        response.mediasPoints.map(p => p.x),
        response.mediasPoints.map(p => p.y),
      ).funct
    }
  }
  response.mediaFunction = mediaFunction

  /** Funciones perpendiculares para Lampara 1. */
  const transversalFunctions: {
    m: number
    funct: ((h: number) => number)
  }[] = []
  for (let i = 0; i < lamp.width; i++) {
    const p1 = { x: i, y: mediaFunction(i) }
    // // Perpendicular a lamp1Function(i).
    // const m_perp = -1 / interpolated.derived(p1.x)
    // const b = p1.y - m_perp * p1.x
    // transversalFunctions.push({
    //   m: m_perp,
    //   funct: (y: number) => ((y - b) / m_perp), // Para cada Y me da ele x que le corresponde.
    // })
    // Perpendicular a la imagen.
    transversalFunctions.push({
      m: Infinity,
      funct: (_y: number) => (p1.x), // Para cada Y me da ele x que le corresponde.
      // En el caso Vertical siempre va a ser el X del punto.
    })
  }
  response.transversalFunctions = transversalFunctions

  /** Promedio de pixeles que pasan por cada lamp1TransversalFunction. */
  const transversalAvgs: number[] = []
  for (let i = 0; i < transversalFunctions.length; i++) {
    const point = { x: i, y: mediaFunction(i) }
    const { forward, backward } = extremePoints(
      point,
      transversalFunctions[i].m,
      response.avgOpening / 2,
    )

    const minY = round(min(forward.y, backward.y))
    const maxY = round(max(forward.y, backward.y))
    const values: number[] = getPointsInRect(
      lamp.data,
      lamp.width,
      transversalFunctions[i].funct,
      minY,
      maxY,
    )

    if (values.length === 0)
      transversalAvgs.push(0)
    else
      transversalAvgs.push(mean(values))
  }
  response.transversalAvgs = transversalAvgs

  return response
}

export function extractFeatures(
  setResponse: Dispatch<SetStateAction<useExtractFeaturesResponse|undefined>>,
  countCheckpoints: number,
  segmentWidth: number,
  scienceUrl?: string,
  lamp1Url?: string,
  lamp2Url?: string,
  useSpline?: boolean,
  reuseScienceFunction?: boolean,
): useExtractFeaturesResponse {
  /** Resultados a devolver */
  const response = {
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
    lamp2MediasPoints: [],
    lamp2AvgOpening: 0,
    lamp2Function: null,
    lamp2TransversalFunctions: [],
    lamp2TransversalAvgs: [],
  }

  useEffect(() => {
    let bag: useExtractFeaturesResponse = {
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
      lamp2MediasPoints: [],
      lamp2AvgOpening: 0,
      lamp2Function: null,
      lamp2TransversalFunctions: [],
      lamp2TransversalAvgs: [],
    }
    if (!scienceUrl || !lamp1Url || !lamp2Url)
      return
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
      let interpolated: { funct: ((x: number) => number), derived: ((x: number) => number) }
      if (useSpline) { // Aproximación spline
        interpolated = splineCuadratic(
          scienceMediasPoints.map(p => p.x),
          scienceMediasPoints.map(p => p.y),
        )
      }
      else { // Aproximación lineal
        interpolated = linearRegressionWhitDerived(
          scienceMediasPoints.map(p => p.x),
          scienceMediasPoints.map(p => p.y),
        )
      }
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
        const lamp1Data = extractLampData({
          science: {
            ...science,
            mediasPoints: bag.scienceMediasPoints,
            avgOpening: bag.scienceAvgOpening,
            mediaFunction: bag.scienceFunction!,
          },
          lamp: lamp1,
          reuseScienceFunction,
          useSpline,
          countCheckpoints,
          segmentWidth,
        })

        // Actualizar salida del metodo con informacion de lamp1
        bag = {
          ...bag,
          lamp1MediasPoints: lamp1Data.mediasPoints,
          lamp1AvgOpening: lamp1Data.avgOpening,
          lamp1Function: lamp1Data.mediaFunction,
          lamp1TransversalFunctions: lamp1Data.transversalFunctions,
          lamp1TransversalAvgs: lamp1Data.transversalAvgs,
        }

        // Lampara 2 datos relevantes.
        // Obtener informacion de imagen de Lamp2
        // Las invocaciones tienen que ser anidadas por que sino
        // corremos riesgo de sobreescritura de variables entre hilos.
        obtainimageMatrix(lamp2Url, false).then((lamp2) => {
          const lamp2Data = extractLampData({
            science: {
              ...science,
              mediasPoints: bag.scienceMediasPoints,
              avgOpening: bag.scienceAvgOpening,
              mediaFunction: bag.scienceFunction!,
            },
            lamp: lamp2,
            reuseScienceFunction,
            useSpline,
            countCheckpoints,
            segmentWidth,
          })

          // Actualizar salida del metodo con informacion de lamp2
          bag = {
            ...bag,
            lamp2MediasPoints: lamp2Data.mediasPoints,
            lamp2AvgOpening: lamp2Data.avgOpening,
            lamp2Function: lamp2Data.mediaFunction,
            lamp2TransversalFunctions: lamp2Data.transversalFunctions,
            lamp2TransversalAvgs: lamp2Data.transversalAvgs,
          }

          setResponse(bag)
        }).catch((err) => {
          console.error("Error loading Image Data:", err)
        })
      }).catch((err) => {
        console.error("Error loading Image Data:", err)
      })
    }).catch((err) => {
      console.error("Error loading Image Data:", err)
    })
  }, [countCheckpoints, lamp1Url, lamp2Url, reuseScienceFunction, scienceUrl, segmentWidth, useSpline])

  return response
}