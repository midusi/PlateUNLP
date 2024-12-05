import { LAMP_MATERIALS, type LampMaterial } from "@/lib/spectral-data"
import { create } from "zustand"
import { CustomError, ErrorCodes } from "./utils"

interface Point { x: number, y: number }

export interface GlobalStore {
  material: LampMaterial
  rangeMin: number
  rangeMax: number
  lampPoints: Point[]
  materialPoints: Point[]
  linesPalette: string[]
  materialsPalette: string[]
  pixelToWavelengthFunction: ((value: number) => number) | CustomError

  setMaterial: (material: LampMaterial) => void
  setRangeMin: (value: number) => void
  setRangeMax: (value: number) => void
  setRange: (min: number, max: number) => void
  setLampPoints: (arr: Point[]) => void
  setMaterialPoints: (arr: Point[]) => void
  setPixelToWavelengthFunction: (arr: ((value: number) => number) | CustomError) => void
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
  /** The color palette for the lines marked for the user. */
  linesPalette: [
    "#FF6B6B",
    "#4ECDC4",
    "#FFD93D",
    "#1A535C",
    "#FF9F1C",
    "#2A9D8F",
    "#E76F51",
  ], // Pastel vibrante

  materialsPalette: [
    "#ff7f0e", // Naranja
    "#d62728", // Rojo
    "#17becf", // Cian
    "#9467bd", // Púrpura
    "#8c564b", // Marrón
    "#e377c2", // Rosa
    "#7f7f7f", // Gris
  ],

  pixelToWavelengthFunction: new CustomError(
    ErrorCodes.INSUFFICIENT_MATCHES,
    "Insufficient matches, at least 2 are required for inference with linear regression.",
  ),

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
  setPixelToWavelengthFunction: (value) => { set({ pixelToWavelengthFunction: value }) },
}))
