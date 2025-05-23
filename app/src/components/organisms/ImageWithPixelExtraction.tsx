import clsx from "clsx"
import { useEffect, useRef } from "react"
import type { Point } from "@/interfaces/Point"
import { Card, CardFooter } from "../atoms/card"

interface ImageWithPixelExtractionProps {
  title?: string
  imageUrl: string
  imageAlt?: string
  children: React.ReactNode
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
  imageUrl,
  imageAlt,
  children,
  pointsWMed,
  drawFunction,
  perpendicularFunctions,
  opening,
}: ImageWithPixelExtractionProps) {
  return (
    <Card className="overflow-hidden bg-slate-100">
      <div
        className={clsx(
          "relative w-full items-center flex justify-center ",
          "px-16",
          "pt-2",
        )}
      >
        <div className="flex flex-col">
          {title && (
            <h2 className="pb-2 flex justify-center text-xl font-semibold text-slate-500">
              {title}
            </h2>
          )}
          <ImageWithDraws
            src={imageUrl}
            alt={imageAlt}
            points={pointsWMed}
            drawFunction={drawFunction}
            perpendicularFunctions={perpendicularFunctions}
            opening={opening}
          />
        </div>
      </div>
      <CardFooter className={clsx("mx-2", "mt-2")}>{children}</CardFooter>
    </Card>
  )
}

interface ImageWithDrawsProps {
  src: string
  alt?: string
  points?: Point[]
  drawFunction?: (x: number) => number
  perpendicularFunctions?: { m: number; funct: (x: number) => number }[]
  opening?: number
}

function ImageWithDraws({
  src,
  alt,
  points,
  drawFunction,
  perpendicularFunctions,
  opening,
}: ImageWithDrawsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
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
    }
    img.src = src
    if (alt) img.alt = alt
  }, [src, points, drawFunction, perpendicularFunctions, opening, alt])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  )
}
