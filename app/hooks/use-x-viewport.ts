import { type RefCallback, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  clampViewport,
  fullViewport,
  isFullViewport,
  panBy,
  type XViewport,
  zoomAt,
} from "~/lib/x-viewport"

/** Sensibilidad de la rueda: `factor = exp(-deltaY * WHEEL_ZOOM_SENSITIVITY)`. */
const WHEEL_ZOOM_SENSITIVITY = 0.0025
/** Pixeles que equivale una "linea" de rueda cuando el navegador reporta `deltaMode = 1`. */
const WHEEL_LINE_HEIGHT = 16

/**
 * Estado del rango de columnas visibles de un espectro.
 * `null` internamente significa vista completa, asi un cambio de `length`
 * (por ejemplo al redimensionar el recorte) no deja un rango desactualizado.
 */
export function useXViewport(length: number) {
  const [zoom, setZoom] = useState<XViewport | null>(null)

  const viewport = useMemo(
    () => (zoom ? clampViewport(zoom, length) : fullViewport(length)),
    [zoom, length],
  )
  const isZoomed = !isFullViewport(viewport, length)

  /**
   * Actualizacion funcional: varios eventos de rueda en un mismo frame (un
   * trackpad rapido) se componen entre si en vez de pisarse.
   */
  const updateViewport = useCallback(
    (update: (current: XViewport) => XViewport) =>
      setZoom((previous) => {
        const next = update(previous ? clampViewport(previous, length) : fullViewport(length))
        return isFullViewport(next, length) ? null : next
      }),
    [length],
  )
  const reset = useCallback(() => setZoom(null), [])

  return { viewport, isZoomed, length, updateViewport, reset }
}

export type XViewportController = ReturnType<typeof useXViewport>

/**
 * Gestos sobre un elemento que muestra las columnas del viewport de punta a
 * punta: rueda = zoom centrado en el cursor, arrastrar = desplazar y doble
 * clic = vista completa.
 *
 * Los listeners son nativos porque `onWheel` de React es pasivo y no permite
 * `preventDefault`, y asi el scroll de la pagina se frena solo cuando la rueda
 * realmente hace zoom.
 * @returns Ref callback para pasarle al elemento.
 */
export function useViewportGestures<T extends HTMLElement>({
  viewport,
  length,
  updateViewport,
  reset,
}: XViewportController): RefCallback<T> {
  /** Ultimo estado, para que los listeners (registrados una sola vez) no queden desactualizados. */
  const latest = useRef({ viewport, length, updateViewport, reset })
  useEffect(() => {
    latest.current = { viewport, length, updateViewport, reset }
  })

  return useCallback((element: T | null) => {
    if (!element) return

    const onWheel = (event: WheelEvent) => {
      const { viewport, length, updateViewport } = latest.current
      const rect = element.getBoundingClientRect()
      if (rect.width === 0) return
      const lineScale = event.deltaMode === 1 ? WHEEL_LINE_HEIGHT : 1

      /** Gesto horizontal (trackpad): desplaza. */
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        if (isFullViewport(viewport, length)) return
        event.preventDefault()
        updateViewport((current) => {
          const span = current.end - current.start
          return panBy(current, ((event.deltaX * lineScale) / rect.width) * span, length)
        })
        return
      }

      const factor = Math.exp(-event.deltaY * lineScale * WHEEL_ZOOM_SENSITIVITY)
      /** Con la vista completa alejar no hace nada: se deja pasar el scroll de la pagina. */
      if (factor <= 1 && isFullViewport(viewport, length)) return
      event.preventDefault()
      /** Posicion del cursor dentro del elemento, de 0 (borde izquierdo) a 1 (derecho). */
      const cursor = (event.clientX - rect.left) / rect.width
      updateViewport((current) => {
        const anchor = current.start + cursor * (current.end - current.start)
        return zoomAt(current, anchor, factor, length)
      })
    }

    let drag: { pointerId: number; startX: number; startViewport: XViewport } | null = null

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      if (isFullViewport(latest.current.viewport, latest.current.length)) return
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startViewport: latest.current.viewport,
      }
      element.setPointerCapture(event.pointerId)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return
      const rect = element.getBoundingClientRect()
      if (rect.width === 0) return
      const { startViewport, startX } = drag
      const span = startViewport.end - startViewport.start
      const deltaColumns = (-(event.clientX - startX) / rect.width) * span
      const { length, updateViewport } = latest.current
      updateViewport(() => panBy(startViewport, deltaColumns, length))
    }
    const endDrag = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return
      element.releasePointerCapture(event.pointerId)
      drag = null
    }
    const onDoubleClick = () => latest.current.reset()

    element.addEventListener("wheel", onWheel, { passive: false })
    element.addEventListener("pointerdown", onPointerDown)
    element.addEventListener("pointermove", onPointerMove)
    element.addEventListener("pointerup", endDrag)
    element.addEventListener("pointercancel", endDrag)
    element.addEventListener("dblclick", onDoubleClick)
    return () => {
      element.removeEventListener("wheel", onWheel)
      element.removeEventListener("pointerdown", onPointerDown)
      element.removeEventListener("pointermove", onPointerMove)
      element.removeEventListener("pointerup", endDrag)
      element.removeEventListener("pointercancel", endDrag)
      element.removeEventListener("dblclick", onDoubleClick)
    }
  }, [])
}
