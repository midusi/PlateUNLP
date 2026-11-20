import { useMeasure } from "@uidotdev/usehooks"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useViewportGestures, type XViewportController } from "~/hooks/use-x-viewport"
import { normalHalfLength, pointOnNormal, type TraceFunctions } from "~/lib/extract-features"
import { loadImage } from "~/lib/load-image"
import { boxFromExtent } from "~/lib/oriented-box"
import { cn } from "~/lib/utils"
import type { Point } from "~/types/Point"

interface ImageWithPixelExtractionProps {
  /**
   * Recorte de la imagen de la observacion que se muestra: el rectangulo que contiene
   * a la caja del espectro. Si la caja esta inclinada (`angle`, en grados), se muestra
   * enderezada, rotada sobre su centro para que el angulo sea 0 y la caja llene la
   * vista; todo lo demas (traza, puntos, mascaras) sigue en coordenadas del recorte
   * original y solo se transforma para dibujarlo.
   */
  image: {
    url: string
    width: number
    height: number
    top: number
    left: number
    angle?: number | null
  }
  /** Centros de la traza, en pixeles del recorte. */
  pointsWMed?: Point[]
  /** Traza del espectro: devuelve la fila para cada columna del recorte. */
  drawFunction: (x: number) => number
  /** Apertura (alto, en pixeles) alrededor de la traza. */
  opening?: number
  /** Derivada de la traza. Hace falta, junto con `opening`, para dibujar las normales. */
  derivedFunction?: (x: number) => number
  /** Dibuja las normales a la traza sobre las que se promedia cada columna. */
  showNormals?: boolean
  /**
   * Pixeles del recorte que la extraccion vio tapados por mascaras de otros
   * espectros (`data[fila * width + columna]` vale 1 si lo estan). Se pintan
   * como los ve el extractor, en negro, para mostrar la imagen tal cual la proceso.
   */
  maskOverlay?: { data: Uint8Array; width: number; height: number } | null
  /** Rango de columnas visibles, compartido con el grafico 1D. */
  xViewport: XViewportController
}

/** Alto minimo en pantalla, para que un recorte muy fino siga siendo legible. */
const MIN_CANVAS_HEIGHT = 56
/** Grosor de las lineas y radio de los puntos, en pixeles de pantalla (no de imagen). */
const LINE_WIDTH = 1.5
const POINT_RADIUS = 2.5
const DASH_PATTERN = [4, 4]
/** Distancia, en pixeles de pantalla, entre dos muestras consecutivas de una curva. */
const CURVE_SAMPLE_STEP = 2
const DRAW_COLOR = "red"
const NORMAL_COLOR = "#22d3ee"
/**
 * Color (RGBA) de los pixeles tapados por una mascara. Es el que ve el
 * extractor: `maskingObservation` los reemplaza por negro, sin transparencia.
 */
const MASK_RGBA = [0, 0, 0, 255] as const
/** Distancia en pantalla, en pixeles, entre dos normales consecutivas. */
const NORMAL_SPACING = 18

/**
 * Pasaje de coordenadas del recorte a pixeles del canvas: rotacion (para enderezar la
 * caja) y escala. Con angulo 0 es solo una escala.
 */
interface CanvasScale {
  /** Primera columna visible del recorte. */
  start: number
  /** Pixeles de canvas por columna del recorte, a lo largo de la traza. */
  x: number
  /** Distancia, en pixeles de canvas, entre dos muestras consecutivas de una curva. */
  sampleStep: number
  /** Pixeles del recorte (con el +0.5 del centro del pixel ya sumado) -> pixeles del canvas. */
  toCanvas: (x: number, y: number) => [number, number]
}

/**
 * Dibuja `drawFunction(x) + offset` como una linea. Las coordenadas de la
 * traza son indices de pixel, y el centro del pixel `i` esta en `i + 0.5`.
 */
function strokeCurve(
  ctx: CanvasRenderingContext2D,
  drawFunction: (x: number) => number,
  offset: number,
  scale: CanvasScale,
  viewport: { start: number; end: number },
  margin: number,
) {
  const stepColumns = Math.max(0.25, scale.sampleStep / scale.x)
  ctx.beginPath()
  let first = true
  for (let column = viewport.start - margin; column <= viewport.end + margin; column += stepColumns) {
    const [px, py] = scale.toCanvas(column + 0.5, drawFunction(column) + offset + 0.5)
    if (first) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
    first = false
  }
  ctx.stroke()
}

/**
 * Dibuja, cada `NORMAL_SPACING` px de pantalla, el segmento de la normal a la
 * traza que `averageAcrossAperture` promedia en esa columna. Los extremos se
 * calculan en coordenadas del recorte y recien despues se pasan al canvas, asi que
 * se ven tal cual los usa la extraccion.
 */
function strokeNormals(
  ctx: CanvasRenderingContext2D,
  trace: TraceFunctions,
  opening: number,
  scale: CanvasScale,
  viewport: { start: number; end: number },
  dpr: number,
) {
  const stepColumns = Math.max(1, Math.round((NORMAL_SPACING * dpr) / scale.x))
  const first = Math.ceil(viewport.start / stepColumns) * stepColumns
  ctx.strokeStyle = NORMAL_COLOR
  ctx.beginPath()
  for (let x = first; x < viewport.end; x += stepColumns) {
    const half = normalHalfLength(trace, x, opening)
    const top = pointOnNormal(trace, x, -half)
    const bottom = pointOnNormal(trace, x, half)
    ctx.moveTo(...scale.toCanvas(top.x + 0.5, top.y + 0.5))
    ctx.lineTo(...scale.toCanvas(bottom.x + 0.5, bottom.y + 0.5))
  }
  ctx.stroke()
}

/** Canvas del tamaño del recorte con los pixeles enmascarados pintados, listo para escalar. */
function renderMaskCanvas(overlay: { data: Uint8Array; width: number; height: number }) {
  const canvas = document.createElement("canvas")
  canvas.width = overlay.width
  canvas.height = overlay.height
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  const pixels = ctx.createImageData(overlay.width, overlay.height)
  for (let i = 0; i < overlay.data.length; i++) {
    if (!overlay.data[i]) continue
    pixels.data.set(MASK_RGBA, i * 4)
  }
  ctx.putImageData(pixels, 0, 0)
  return canvas
}

/**
 * Imagen del recorte de un espectro, a todo el ancho disponible, con la traza,
 * la apertura y los centros dibujados encima. Muestra solo las columnas de
 * `xViewport`, y permite acercarse y desplazarse.
 */
export function ImageWithPixelExtraction({
  image,
  pointsWMed,
  drawFunction,
  opening,
  derivedFunction,
  showNormals,
  maskOverlay,
  xViewport,
}: ImageWithPixelExtractionProps) {
  const { viewport, isZoomed } = xViewport
  const maskCanvas = useMemo(
    () => (maskOverlay ? renderMaskCanvas(maskOverlay) : null),
    [maskOverlay],
  )
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [measureRef, { width: cssWidth, height: cssHeight }] = useMeasure()
  const gestureRef = useViewportGestures<HTMLDivElement>(xViewport)
  const [source, setSource] = useState<HTMLImageElement | null>(null)

  const setCanvas = useCallback(
    (node: HTMLCanvasElement | null) => {
      canvasRef.current = node
      measureRef(node)
    },
    [measureRef],
  )

  /** La imagen se carga una sola vez por URL, no en cada redibujado. */
  useEffect(() => {
    let cancelled = false
    loadImage(image.url).then(
      (loaded) => !cancelled && setSource(loaded),
      () => !cancelled && setSource(null),
    )
    return () => {
      cancelled = true
    }
  }, [image.url])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !source || !cssWidth || !cssHeight) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    /** El canvas se dibuja a resolucion de pantalla, no del recorte. */
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(cssWidth * dpr)
    canvas.height = Math.round(cssHeight * dpr)

    const span = viewport.end - viewport.start
    // La vista es la caja enderezada: del ancho y alto propios de la caja. Las columnas
    // visibles se pasan a su eje horizontal en proporcion, que es como se alarga la
    // caja respecto del recorte, asi cada columna del grafico queda sobre su traza.
    const angle = ((image.angle ?? 0) * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const box = boxFromExtent(image.width, image.height, image.angle ?? 0)
    const columnScale = box.width / image.width
    const originX = viewport.start * columnScale
    const sx = canvas.width / (span * columnScale)
    const sy = canvas.height / box.height
    /** Recorte -> vista enderezada -> canvas. */
    const toCanvas = (x: number, y: number): [number, number] => {
      const dx = x - image.width / 2
      const dy = y - image.height / 2
      return [
        (cos * dx + sin * dy + box.width / 2 - originX) * sx,
        (-sin * dx + cos * dy + box.height / 2) * sy,
      ]
    }
    const scale: CanvasScale = {
      start: viewport.start,
      x: sx * columnScale,
      sampleStep: CURVE_SAMPLE_STEP * dpr,
      toCanvas,
    }
    /** Margen de columnas fuera de la vista que se dibujan: la rotacion corre la traza unos pixeles. */
    const margin = image.height * Math.abs(Math.tan(angle)) + 2

    /** Matriz que dibuja un canvas/imagen del tamaño del recorte ya enderezado. */
    const [e, f] = toCanvas(0, 0)
    const placeCrop = () => ctx.setTransform(sx * cos, -sy * sin, sx * sin, sy * cos, e, f)

    /** Suavizar solo al reducir: al ampliar se ven los pixeles tal cual son. */
    ctx.imageSmoothingEnabled = scale.x < 1 || angle !== 0
    placeCrop()
    ctx.drawImage(
      source,
      image.left,
      image.top,
      image.width,
      image.height,
      0,
      0,
      image.width,
      image.height,
    )

    if (maskCanvas) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(maskCanvas, 0, 0, image.width, image.height)
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    ctx.fillStyle = DRAW_COLOR
    ctx.strokeStyle = DRAW_COLOR
    ctx.lineWidth = LINE_WIDTH * dpr

    for (const point of pointsWMed ?? []) {
      if (point.x < viewport.start - margin || point.x > viewport.end + margin) continue
      const [px, py] = toCanvas(point.x + 0.5, point.y + 0.5)
      ctx.beginPath()
      ctx.arc(px, py, POINT_RADIUS * dpr, 0, 2 * Math.PI)
      ctx.fill()
    }

    if (showNormals && opening && derivedFunction) {
      strokeNormals(
        ctx,
        { funct: drawFunction, derived: derivedFunction },
        opening,
        scale,
        viewport,
        dpr,
      )
      ctx.strokeStyle = DRAW_COLOR
    }

    strokeCurve(ctx, drawFunction, 0, scale, viewport, margin)

    if (opening) {
      ctx.setLineDash(DASH_PATTERN.map((length) => length * dpr))
      strokeCurve(ctx, drawFunction, opening / 2, scale, viewport, margin)
      strokeCurve(ctx, drawFunction, -opening / 2, scale, viewport, margin)
      ctx.setLineDash([])
    }
  }, [
    source,
    cssWidth,
    cssHeight,
    viewport,
    image,
    pointsWMed,
    drawFunction,
    opening,
    derivedFunction,
    showNormals,
    maskCanvas,
  ])

  return (
    <div
      ref={gestureRef}
      className={cn("w-full touch-pan-y select-none overflow-hidden", isZoomed && "cursor-grab")}
    >
      <canvas
        ref={setCanvas}
        role="img"
        aria-label="Spectrum crop with the extraction trace and aperture"
        className="block w-full"
        style={{
          aspectRatio: `${boxFromExtent(image.width, image.height, image.angle ?? 0).width} / ${boxFromExtent(image.width, image.height, image.angle ?? 0).height}`,
          minHeight: MIN_CANVAS_HEIGHT,
        }}
      />
    </div>
  )
}
