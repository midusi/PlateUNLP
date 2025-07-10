import { max, mean, min, round } from "mathjs"
import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import {
  findPlateau,
  findXspacedPoints,
  getPointsInRect,
  obtainImageSegments,
  promediadoHorizontal,
} from "~/lib/image"
import { extremePoints } from "~/lib/trigonometry"
import { linearRegressionWhitDerived, splineCuadratic } from "~/lib/utils"
import type { Point } from "~/types/Point"

export interface useExtractFeaturesResponse<T extends Uint8Array | Uint8ClampedArray | Buffer> {
  scienceInfo: {
    data: T
    width: number
    height: number
  } | null
  scienceMediasPoints: Point[]
  scienceAvgOpening: number
  scienceFunction: ((value: number) => number) | null
  scienceTransversalFunctions: {
    m: number
    funct: (h: number) => number
  }[]
  scienceTransversalAvgs: number[]
  lamp1MediasPoints: Point[]
  lamp1AvgOpening: number
  lamp1Function: ((value: number) => number) | null
  lamp1TransversalFunctions: {
    m: number
    funct: (h: number) => number
  }[]
  lamp1TransversalAvgs: number[]
  lamp2MediasPoints: Point[]
  lamp2AvgOpening: number
  lamp2Function: ((value: number) => number) | null
  lamp2TransversalFunctions: {
    m: number
    funct: (h: number) => number
  }[]
  lamp2TransversalAvgs: number[]
}

export function useExtractFeatures<T extends Uint8Array | Uint8ClampedArray | Buffer>(
  countCheckpoints: number,
  segmentWidth: number,
  /** Imagen de espectro de ciencia */
  science: T,
  /** Imagen de lampara de comparación */
  lamp1?: T,
  /** Imagen de lampara de comparación 2 */
  lamp2?: T,
  useSpline?: boolean,
  reuseScienceFunction?: boolean,
): useExtractFeaturesResponse<T> {
  /** Resultados a devolver */
  const [response, setResponse] = useState<useExtractFeaturesResponse<T>>({
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
    let bag: useExtractFeaturesResponse<T> = {
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

    /** Si falta alguno de los 3 espectros retorna */
    if (!science || !lamp1 || !lamp2) return
    /** Si el espectro de ciencia esta vacio retorna */
    if (science.length === 0) return

    const { width: _width, height: _height } = sizeOf(Buffer.from(science))
    bag.scienceInfo = {
      data: science,
      width: _width,
      height: _height,
    }

    // Segmentar la imagen
    /** Coordenadas X medias a lo largo de toda la imagen de SCIENCE */
    const sciencePoints = findXspacedPoints(bag.scienceInfo.width, countCheckpoints)
    /** Segmentos medios de imagen de SCIENCE */
    const segmentsData = obtainImageSegments(
      science,
      bag.scienceInfo.width,
      bag.scienceInfo.height,
      sciencePoints,
      segmentWidth,
    )
    for (const sd of segmentsData) {
      if (sd.length !== segmentWidth * bag.scienceInfo.height * 4)
        console.warn("Segment size mismatch:", sd.length, segmentWidth * bag.scienceInfo.height * 4)
    }

    /**
     * Funciones de cada segmento promediado horizontalmente
     * Osea, para cada pixel vertical se hace un avg de los pixeles
     * horizontales. x=>pixelVertical, y=>avgHorizontal
     */
    const scienceFunctions = segmentsData.map((data) =>
      promediadoHorizontal(data, segmentWidth, bag.scienceInfo!.height),
    )

    /**
     * Arreglo con informacion de para cada funcion de un segmento el
     * punto vertical medio y la apartura que le corresponde.
     */
    const sciencePlateauInfo: {
      medium: number
      opening: number
    }[] = scienceFunctions.map((funct) => findPlateau(funct, 0.5))

    /** Apertura promedio */
    const avgOpening = mean(sciencePlateauInfo.map((pi) => pi.opening))
    bag.scienceAvgOpening = avgOpening

    /**
     * Conjuntos de cordenadas (x,y) de los puntos que trazan la recta
     * media de la función.
     */
    const scienceMediasPoints = sciencePoints.map((point, index) => ({
      x: point,
      y: sciencePlateauInfo[index]?.medium ?? 0,
    }))
    bag.scienceMediasPoints = scienceMediasPoints

    // Infiere funcion medio del espectro
    let interpolated: {
      funct: (x: number) => number
      derived: (x: number) => number
    }
    if (useSpline) {
      // Aproximación spline
      interpolated = splineCuadratic(
        scienceMediasPoints.map((p) => p.x),
        scienceMediasPoints.map((p) => p.y),
      )
    } else {
      // Aproximación lineal
      interpolated = linearRegressionWhitDerived(
        scienceMediasPoints.map((p) => p.x),
        scienceMediasPoints.map((p) => p.y),
      )
    }
    bag.scienceFunction = interpolated.funct

    /**
     * Arreglo de funciones que para cada punto de la recta, dada una altura Y
     * indica el pixel X que le corresponde.
     */
    const scienceTransversalFunctions: {
      m: number
      funct: (h: number) => number
    }[] = []
    for (let i = 0; i < bag.scienceInfo.width; i++) {
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
        funct: (_y: number) => p1.x, // Para cada Y me da ele x que le corresponde.
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
        science,
        bag.scienceInfo.width,
        scienceTransversalFunctions[i].funct,
        minY,
        maxY,
      )

      // si no hay valores entonces devuelve 0
      if (values.length === 0) scienceTransversalAvgs.push(0)
      else scienceTransversalAvgs.push(mean(values))
    }
    bag.scienceTransversalAvgs = scienceTransversalAvgs

    /** Lampara de comparación 1. Datos relevantes */
    const { width: l1_width, height: l1_height } = sizeOf(Buffer.from(lamp1))
    const lamp1Info = {
      data: lamp1,
      width: l1_width,
      height: l1_height,
    }
    const lamp1Data = extractLampData({
      science: {
        ...bag.scienceInfo,
        mediasPoints: bag.scienceMediasPoints,
        avgOpening: bag.scienceAvgOpening,
        mediaFunction: bag.scienceFunction!,
      },
      lamp: lamp1Info,
      reuseScienceFunction,
      useSpline,
      countCheckpoints,
      segmentWidth,
    })

    /** Actualizar salida del metodo con informacion de lamp1 */
    bag = {
      ...bag,
      lamp1MediasPoints: lamp1Data.mediasPoints,
      lamp1AvgOpening: lamp1Data.avgOpening,
      lamp1Function: lamp1Data.mediaFunction,
      lamp1TransversalFunctions: lamp1Data.transversalFunctions,
      lamp1TransversalAvgs: lamp1Data.transversalAvgs,
    }

    /** Lampara de comparación 2. Datos relevantes */
    const { width: l2_width, height: l2_height } = sizeOf(Buffer.from(lamp2))
    const lamp2Info = {
      data: lamp2,
      width: l2_width,
      height: l2_height,
    }

    const lamp2Data = extractLampData({
      science: {
        ...lamp2Info,
        mediasPoints: bag.scienceMediasPoints,
        avgOpening: bag.scienceAvgOpening,
        mediaFunction: bag.scienceFunction!,
      },
      lamp: lamp2Info,
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
  }, [countCheckpoints, lamp1, lamp2, reuseScienceFunction, science, segmentWidth, useSpline])

  return response
}

interface extractLampDataProps<T extends Uint8Array | Uint8ClampedArray | Buffer> {
  science: {
    data: T
    width: number
    height: number
    mediasPoints: Point[]
    avgOpening: number
    mediaFunction: (value: number) => number
  }
  lamp: {
    data: T
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
    funct: (h: number) => number
  }[]
  transversalAvgs: number[]
}
function extractLampData<T extends Uint8Array | Uint8ClampedArray | Buffer>({
  science,
  lamp,
  reuseScienceFunction,
  useSpline,
  countCheckpoints,
  segmentWidth,
}: extractLampDataProps<T>): extractLampDataResponse {
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
  if (reuseScienceFunction) {
    // Reusar los del espectro de ciencia pero los escala.
    mediasPoints = science.mediasPoints.map(({ x, y }) => ({
      x: round(x * scaleLamp.x),
      y: y * scaleLamp.y,
    }))
  } else {
    // Infiere los suyos.
    const lampPoints = findXspacedPoints(science.width, countCheckpoints!)

    const segmentsData = obtainImageSegments(
      lamp.data,
      lamp.width,
      lamp.height,
      lampPoints,
      segmentWidth!,
    )
    const lampFunctions = segmentsData.map((data) =>
      promediadoHorizontal(data, segmentWidth!, science.height),
    )

    const lampPlateauInfo: {
      medium: number
      opening: number
    }[] = lampFunctions.map((funct) => findPlateau(funct, 0.5))
    mediasPoints = lampPoints.map((point, index) => ({
      x: point,
      y: lampPlateauInfo[index]?.medium ?? 0,
    }))
  }
  response.mediasPoints = mediasPoints

  /** Apertura promedio de lampara. Tomamos la misma que la del espectro */
  response.avgOpening = science.avgOpening

  /** Funcion media para Lampara */
  let mediaFunction: (value: number) => number
  if (reuseScienceFunction) {
    // Reusar la del espectro de ciencia pero lo escala.
    mediaFunction = (x: number) => science.mediaFunction!(round(x * scaleLamp.x)) * scaleLamp.y
  } else {
    // Infiere la suya en base a sus medias points
    if (useSpline) {
      // Aproximación spline
      mediaFunction = splineCuadratic(
        response.mediasPoints.map((p) => p.x),
        response.mediasPoints.map((p) => p.y),
      ).funct
    } else {
      // Aproximación lineal
      mediaFunction = linearRegressionWhitDerived(
        response.mediasPoints.map((p) => p.x),
        response.mediasPoints.map((p) => p.y),
      ).funct
    }
  }
  response.mediaFunction = mediaFunction

  /** Funciones perpendiculares para Lampara 1. */
  const transversalFunctions: {
    m: number
    funct: (h: number) => number
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
      funct: (_y: number) => p1.x, // Para cada Y me da ele x que le corresponde.
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

    if (values.length === 0) transversalAvgs.push(0)
    else transversalAvgs.push(mean(values))
  }
  response.transversalAvgs = transversalAvgs

  return response
}
