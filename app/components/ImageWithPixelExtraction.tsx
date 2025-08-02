import clsx from "clsx"
import { useEffect, useRef } from "react"
import type { Point } from "~/types/Point"

interface ImageWithPixelExtractionProps {
  title?: string
  image: { url: string; width: number; height: number; top: number; left: number }
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
  pointsWMed,
  drawFunction,
  opening,
}: ImageWithPixelExtractionProps) {
  return (
    <div className={clsx("relative flex w-full items-center justify-center ", "px-8", "pt-1")}>
      <div className="flex flex-col">
        {title && (
          <h3 className="flex justify-center pb-1 font-semibold text-lg text-slate-500">{title}</h3>
        )}
        <ImageWithDraws
          image={image}
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
  image: { url: string; width: number; height: number; top: number; left: number }
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
function ImageWithDraws({ image, points, drawFunction, opening }: ImageWithDrawsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Cargar imagen de la observación
    const obsImg = new Image()
    /** Asociar URL */
    obsImg.src = image.url
    obsImg.onload = () => {
      canvas.width = image.width
      canvas.height = image.height

      const lineSize = image.height * 0.03
      const pointSize = image.height * 0.06

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(
        obsImg,
        image.left,
        image.top,
        image.width,
        image.height,
        0,
        0,
        image.width,
        image.height,
      )

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
  }, [image, points, drawFunction, opening])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  )
}
