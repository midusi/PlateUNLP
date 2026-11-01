import { useMeasure } from "@uidotdev/usehooks"
import { useCallback, useEffect, useRef, useState } from "react"
import { useViewportGestures, type XViewportController } from "~/hooks/use-x-viewport"
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
 * Imagen del recorte de un espectro, a todo el ancho disponible, con la traza,
 * la apertura y los centros dibujados encima. Muestra solo las columnas de
 * `xViewport`, y permite acercarse y desplazarse.
 */
export function ImageWithPixelExtraction({
  image,
  pointsWMed,
  drawFunction,
  opening,
  xViewport,
}: ImageWithPixelExtractionProps) {
  const { viewport, isZoomed } = xViewport
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

    strokeCurve(ctx, drawFunction, 0, scale, canvas.width)

    if (opening) {
      ctx.setLineDash(DASH_PATTERN.map((length) => length * dpr))
      strokeCurve(ctx, drawFunction, opening / 2, scale, canvas.width)
      strokeCurve(ctx, drawFunction, -opening / 2, scale, canvas.width)
      ctx.setLineDash([])
    }
  }, [source, cssWidth, cssHeight, viewport, image, pointsWMed, drawFunction, opening])

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
