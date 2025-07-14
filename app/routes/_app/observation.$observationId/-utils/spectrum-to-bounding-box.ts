import type { BoundingBox } from "~/components/BoundingBoxer"
import { idToColor } from "~/lib/utils"
import type { getSpectrums } from "../-actions/get-spectrums"

export type Spectrum = Awaited<ReturnType<typeof getSpectrums>>[number]

export function spectrumToBoundingBox(spectrum: Spectrum): BoundingBox {
  return {
    id: spectrum.id,
    name: "",
    color: idToColor(spectrum.id),
    top: spectrum.imgTop,
    left: spectrum.imgLeft,
    width: spectrum.imgWidth,
    height: spectrum.imgHeight,
  }
}
