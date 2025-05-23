import { type RefCallback, useCallback, useRef, useState } from "react"

/**
 * The useMeasure hook provides a convenient and efficient way to monitor and
 * respond to changes in the size of a React component. This custom hook uses
 * the ResizeObserver API to actively track changes in the component’s
 * dimensions, such as width and height, and keeps them available as state.
 * The returned ref is used on the element whose dimensions you want to
 * measure, making it a valuable tool for responsive design and dynamic
 * layout adjustments.
 *
 *
 * @see https://github.com/uidotdev/usehooks/blob/61655761f069ad06c698fb71092480906e1171be/index.js#L989-L1019
 */
export function useMeasure<T extends Element>() {
  const [dimensions, setDimensions] = useState<{
    width: number | null
    height: number | null
  }>({
    width: null,
    height: null,
  })

  const previousObserver = useRef<ResizeObserver | null>(null)

  const customRef: RefCallback<T> = useCallback((node) => {
    if (previousObserver.current) {
      previousObserver.current.disconnect()
      previousObserver.current = null
    }

    if (node?.nodeType === Node.ELEMENT_NODE) {
      const observer = new ResizeObserver(([entry]) => {
        if (entry && entry.borderBoxSize) {
          const { inlineSize: width, blockSize: height } =
            entry.borderBoxSize[0]

          setDimensions({ width, height })
        }
      })

      observer.observe(node)
      previousObserver.current = observer
    }
  }, [])

  return [customRef, dimensions] as const
}
