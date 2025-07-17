import clsx from "clsx"
import { useEffect, useMemo, useRef } from "react"
import type { Point } from "~/types/Point"

interface ImageWithPixelExtractionProps {
  title?: string
  /** Imagen */
  image: string | Uint8Array
  imageAlt?: string
  pointsWMed?: Point[]
  drawFunction: (x: number) => number
  perpendicularFunctions?: {
    m: number
    funct: (x: number) => number
  }[]
  opening?: number
}

export function ImageWithPixelExtraction({
  title,
  image,
  imageAlt,
  pointsWMed,
  drawFunction,
  opening,
}: ImageWithPixelExtractionProps) {
  const src = useMemo(
    () => (typeof image === "string" ? image : URL.createObjectURL(new Blob([image]))),
    [image],
  )

  return (
    <div className={clsx("relative flex w-full items-center justify-center ", "px-8", "pt-1")}>
      <div className="flex flex-col">
        {title && (
          <h3 className="flex justify-center pb-1 font-semibold text-lg text-slate-500">{title}</h3>
        )}
        <ImageWithDraws
          src={src}
          alt={imageAlt}
          points={pointsWMed}
          drawFunction={drawFunction}
          opening={opening}
        />
      </div>
    </div>
  )
}

/**
 * Props para el componente ImageWithDraws.
 * @interface ImageWithDraws
 */
interface ImageWithDrawsProps {
  /** Imagen */
  src: string
  /** Texto alternativo opcional */
  alt?: string
  /** Puntos a dibujar sobre la imagen */
  points?: Point[]
  /** Función para dibujar una curva */
  drawFunction?: (x: number) => number
  /** Apertura para dibujo de perpendiculares */
  opening?: number
}

/**
 * Dibuja una imagen con funciones, puntos y líneas personalizadas sobre ella.
 */
function ImageWithDraws({ src, alt, points, drawFunction, opening }: ImageWithDrawsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    /** Imagen a devolver */
    const img = new Image()
    /** Asociar URL */
    img.src = src
    /** Asociar ALT */
    if (alt) img.alt = alt
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      const lineSize = img.height * 0.03
      const pointSize = img.height * 0.06

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
        ctx.lineWidth = lineSize
        ctx.beginPath()
        for (let x = 0; x < canvas.width; x++) {
          const y = drawFunction(x)
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      // Dibujar rectas si está definidas
      if (drawFunction && opening) {
        const diffToCenter = opening / 2
        function funcionUP(x: number): number {
          return drawFunction!(x) + diffToCenter
        }
        function funcionDown(x: number): number {
          return drawFunction!(x) - diffToCenter
        }

        ctx.strokeStyle = "red"
        ctx.lineWidth = lineSize
        ctx.setLineDash([5, 5]) // Linea punteada
        ctx.beginPath()
        for (let x = 0; x < canvas.width; x++) {
          const y = funcionUP(x)
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()

        ctx.strokeStyle = "red"
        ctx.lineWidth = lineSize
        ctx.setLineDash([5, 5]) // Linea punteada
        ctx.beginPath()
        for (let x = 0; x < canvas.width; x++) {
          const y = funcionDown(x)
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }
    }

    /** Limpieza por si el componente se desmonta antes de cargar */
    return () => {}
  }, [src, points, drawFunction, opening, alt])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  )
}
