import type { BBClassesProps } from "~/types/BBClasses"

export interface BoundingBox {
  id: number | string
  name: string
  x: number
  y: number
  width: number
  height: number
  class_info: BBClassesProps
  prob: number
}
