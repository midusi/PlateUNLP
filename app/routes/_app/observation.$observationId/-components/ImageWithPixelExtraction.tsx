import clsx from "clsx"
import { useEffect, useRef } from "react"
import type { Point } from "~/types/Point"

interface ImageWithPixelExtractionProps<T extends Uint8Array | Uint8ClampedArray | Buffer> {
  title?: string
  /** Imagen */
  image: T
  imageAlt?: string
  pointsWMed?: Point[]
  drawFunction: (x: number) => number
  perpendicularFunctions?: {
    m: number
    funct: (x: number) => number
  }[]
  opening?: number
}

export function ImageWithPixelExtraction<T extends Uint8Array | Uint8ClampedArray | Buffer>({
  title,
  image,
  imageAlt,
  pointsWMed,
  drawFunction,
  perpendicularFunctions,
  opening,
}: ImageWithPixelExtractionProps<T>) {
  return (
    <div className={clsx("relative flex w-full items-center justify-center ", "px-16", "pt-2")}>
      <div className="flex flex-col">
        {title && (
          <h2 className="flex justify-center pb-2 font-semibold text-slate-500 text-xl">{title}</h2>
        )}
        <ImageWithDraws
          image={image}
          alt={imageAlt}
          points={pointsWMed}
          drawFunction={drawFunction}
          perpendicularFunctions={perpendicularFunctions}
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
interface ImageWithDrawsProps<T extends Uint8Array | Uint8ClampedArray | Buffer> {
  /** Imagen */
  image: T
  /** Texto alternativo opcional */
  alt?: string
  /** Puntos a dibujar sobre la imagen */
  points?: Point[]
  /** Función para dibujar una curva */
  drawFunction?: (x: number) => number
  /** Funciones perpendiculares a dibujar (con pendiente y función asociada) */
  perpendicularFunctions?: { m: number; funct: (x: number) => number }[]
  /** Apertura para dibujo de perpendiculares */
  opening?: number
}

/**
 * Dibuja una imagen con funciones, puntos y líneas personalizadas sobre ella.
 */
function ImageWithDraws<T extends Uint8Array | Uint8ClampedArray | Buffer>({
  image,
  alt,
  points,
  drawFunction,
  perpendicularFunctions,
  opening,
}: ImageWithDrawsProps<T>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    /** 🔄 Convertir el buffer binario en objeto URL válido */
    const blob = new Blob([image], { type: "image/png" }) // o "image/jpeg", según corresponda
    const objectUrl = URL.createObjectURL(blob)

    /** Imagen a devolver */
    const img = new Image()
    /** Asociar URL */
    img.src = objectUrl
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
      if (perpendicularFunctions && drawFunction && opening) {
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

      /** La imagen ya esta dibujada librar memoria asociada al blob */
      URL.revokeObjectURL(objectUrl)
    }

    /** Limpieza por si el componente se desmonta antes de cargar */
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [image, points, drawFunction, perpendicularFunctions, opening, alt])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  )
}
