import { useMeasure } from "@uidotdev/usehooks"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useViewportGestures, type XViewportController } from "~/hooks/use-x-viewport"
import { normalHalfLength, pointOnNormal, type TraceFunctions } from "~/lib/extract-features"
import { loadImage } from "~/lib/load-image"
import { cn } from "~/lib/utils"
import type { Point } from "~/types/Point"

interface ImageWithPixelExtractionProps {
  /** Recorte de la imagen de la observacion que se muestra. */
  image: { url: string; width: number; height: number; top: number; left: number }
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

/** Escala del dibujo: de coordenadas del recorte a pixeles del canvas. */
interface CanvasScale {
  /** Primera columna visible. */
  start: number
  /** Pixeles de canvas por columna del recorte. */
  x: number
  /** Pixeles de canvas por fila del recorte. */
  y: number
  /** Distancia, en pixeles de canvas, entre dos muestras consecutivas de una curva. */
  sampleStep: number
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
  canvasWidth: number,
) {
  ctx.beginPath()
  for (let px = 0; px <= canvasWidth; px += scale.sampleStep) {
    const index = scale.start + px / scale.x - 0.5
    const y = (drawFunction(index) + offset + 0.5) * scale.y
    if (px === 0) ctx.moveTo(px, y)
    else ctx.lineTo(px, y)
  }
  ctx.stroke()
}

/**
 * Dibuja, cada `NORMAL_SPACING` px de pantalla, el segmento de la normal a la
 * traza que `averageAcrossAperture` promedia en esa columna. Los extremos se
 * calculan en coordenadas del recorte y recien despues se escalan, asi que si
 * el zoom estira solo el eje x se ven tal cual los usa la extraccion.
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
    ctx.moveTo((top.x + 0.5 - viewport.start) * scale.x, (top.y + 0.5) * scale.y)
    ctx.lineTo((bottom.x + 0.5 - viewport.start) * scale.x, (bottom.y + 0.5) * scale.y)
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
    const scale: CanvasScale = {
      start: viewport.start,
      x: canvas.width / span,
      y: canvas.height / image.height,
      sampleStep: CURVE_SAMPLE_STEP * dpr,
    }

    /** Suavizar solo al reducir: al ampliar se ven los pixeles tal cual son. */
    ctx.imageSmoothingEnabled = scale.x < 1
    ctx.drawImage(
      source,
      image.left + viewport.start,
      image.top,
      span,
      image.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    if (maskCanvas) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(
        maskCanvas,
        viewport.start,
        0,
        span,
        maskCanvas.height,
        0,
        0,
        canvas.width,
        canvas.height,
      )
    }

    ctx.fillStyle = DRAW_COLOR
    ctx.strokeStyle = DRAW_COLOR
    ctx.lineWidth = LINE_WIDTH * dpr

    for (const point of pointsWMed ?? []) {
      if (point.x < viewport.start || point.x > viewport.end) continue
      ctx.beginPath()
      ctx.arc(
        (point.x + 0.5 - viewport.start) * scale.x,
        (point.y + 0.5) * scale.y,
        POINT_RADIUS * dpr,
        0,
        2 * Math.PI,
      )
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

    strokeCurve(ctx, drawFunction, 0, scale, canvas.width)

    if (opening) {
      ctx.setLineDash(DASH_PATTERN.map((length) => length * dpr))
      strokeCurve(ctx, drawFunction, opening / 2, scale, canvas.width)
      strokeCurve(ctx, drawFunction, -opening / 2, scale, canvas.width)
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
          aspectRatio: `${image.width} / ${image.height}`,
          minHeight: MIN_CANVAS_HEIGHT,
        }}
      />
    </div>
  )
}
