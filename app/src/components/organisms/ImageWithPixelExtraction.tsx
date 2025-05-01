import type { Point } from "@/interfaces/Point"
import { extremePoints } from "@/lib/trigonometry"
import clsx from "clsx"
import { useEffect, useRef } from "react"
import { Card, CardFooter } from "../atoms/card"

interface ImageWithPixelExtractionProps {
  title?: string
  imageUrl: string
  imageAlt?: string
  children: React.ReactNode
  pointsWMed: Point[]
  drawFunction: ((x: number) => number)
  perpendicularFunctions: {
    m: number
    funct: ((x: number) => number)
  }[]
  opening: number
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
            <h2
              className="pb-2 flex justify-center text-xl font-semibold text-slate-500"
            >
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
  points: Point[]
  drawFunction?: ((x: number) => number)
  perpendicularFunctions: { m: number, funct: ((x: number) => number) }[]
  opening?: number
}

function ImageWithDraws({ src, alt, points, drawFunction, perpendicularFunctions, opening }: ImageWithDrawsProps) {
  const pointSize = 8

  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas)
      return
    const ctx = canvas.getContext("2d")
    if (!ctx)
      return
    const img = new Image()
    img.onload = function () {
      canvas.width = img.width
      canvas.height = img.height

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
        ctx.lineWidth = 4
        ctx.beginPath()
        for (let x = 0; x < canvas.width; x++) {
          const y = drawFunction(x)
          if (x === 0) {
            ctx.moveTo(x, y)
          }
          else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      // Dibujar rectas si está definidas
      if (perpendicularFunctions && drawFunction && opening) {
        for (let i = 0; i < perpendicularFunctions.length; i += 100) {
          const point = { x: i, y: drawFunction(i) }

          // // Punto central
          // ctx.fillStyle = "steelblue"
          // ctx.strokeStyle = "black" // borde negro
          // ctx.beginPath()
          // ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI)
          // ctx.fill()

          // const verticalRect = perpendicularFunctions[point.x].funct
          const m = perpendicularFunctions[point.x].m
          ctx.strokeStyle = "steelblue"
          ctx.lineWidth = 6
          ctx.beginPath()

          // Punto destino arriba y abajo
          const { forward: pdup, backward: pddown } = extremePoints(point, m, opening / 2)

          ctx.moveTo(pdup.x, pdup.y)
          ctx.lineTo(pddown.x, pddown.y)
          ctx.stroke()

          // inicio y fin
          ctx.fillStyle = "steelblue"
          ctx.beginPath()
          ctx.arc(pddown.x, pddown.y, 10, 0, 2 * Math.PI)
          ctx.arc(pdup.x, pdup.y, 10, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
    }
    img.src = src
    if (alt)
      img.alt = alt
  }, [src, points, drawFunction, perpendicularFunctions, opening, alt])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: "100%", height: "auto", display: "block" }}
    />
  )
}
