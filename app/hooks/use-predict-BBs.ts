import { useCallback } from "react"
import { predictBoundingBoxes } from "~/routes/_app/-actions/predict-bounding-boxes"
import type { BBClassesProps } from "~/types/BBClasses"
import type { BoundingBox } from "~/types/BoundingBox"

export function usePredictBBs(
  size: number,
  model: string,
  classes: BBClassesProps[],
  forceMaxWidth = false,
  confidence_threshold = 0.75,
): (observationId: string) => Promise<BoundingBox[]> {
  const determineBBs = useCallback(
    async (observationId: string): Promise<BoundingBox[]> => {
      const result = await predictBoundingBoxes({
        data: {
          observationId,
          size,
          model,
          classes,
          forceMaxWidth,
          confidenceThreshold: confidence_threshold,
        },
      })

      // Reasignar IDs secuenciales
      return (result as BoundingBox[]).map((bb, idx) => ({
        ...bb,
        id: idx,
      }))
    },
    [size, model, classes, forceMaxWidth, confidence_threshold],
  )

  return determineBBs
}
