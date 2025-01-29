import type { Spectrum } from "@/enums/Spectrum"

export interface BoundingBox {
    id: number
    name: string
    x: number
    y: number
    width: number
    height: number
    content: Spectrum
}
