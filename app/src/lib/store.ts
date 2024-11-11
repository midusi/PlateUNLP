import { LAMP_MATERIALS, type LampMaterial } from "@/lib/spectral-data"
import { create } from "zustand"

interface Point { x: number, y: number }

export interface GlobalStore {
  material: LampMaterial
  rangeMin: number
  rangeMax: number
  lampPoints: Point[]
  materialPoints: Point[]

  setMaterial: (material: LampMaterial) => void
  setRangeMin: (value: number) => void
  setRangeMax: (value: number) => void
  setRange: (min: number, max: number) => void
  setLampPoints: (arr: Point[]) => void
  setMaterialPoints: (arr: Point[]) => void
}

export const globalStore = create<GlobalStore>()(set => ({
  /** The selected material for the reference lamp. */
  material: LAMP_MATERIALS[0],
  /** The low part of the range of the reference lamp. */
  rangeMin: 10000,
  /** The high part of the range of the reference lamp. */
  rangeMax: 20000,
  /** The points marked in the lamp espectrum. */
  lampPoints: [],
  /** The points marked in the material lamp espectrum. */
  materialPoints: [],

  setMaterial: (value) => {
    if (LAMP_MATERIALS.includes(value)) {
      set({ material: value })
    }
    else {
      console.error(`Invalid material: ${value}`)
    }
  },
  setRangeMin: value => set({ rangeMin: Math.round(value) }),
  setRangeMax: value => set({ rangeMax: Math.round(value) }),
  setRange: (min, max) => set({ rangeMin: Math.round(min), rangeMax: Math.round(max) }),
  setLampPoints: (arr: Point[]) => { set({ lampPoints: arr }) },
  setMaterialPoints: (arr: Point[]) => { set({ materialPoints: arr }) },
}))
