import { PlateMetadata } from "@/components/molecules/PlateMetadataForm"
import type { BoundingBox } from "./BoundingBox"

export interface ProcessInfoForm {
  processingStatus: { // Info estado de procesado de cada etapa de la barra de navegación
    generalSteps: StepGeneralInfoForm[] // Etapas compartidas por toda la placas
    specificSteps: StepSpecificInfoForm[] // Etapas especificas para cada espectro
  }
  data: { // Informacion como tal, imagen, metadatos, ...
    plate: {
      scanImage: string | null // Imagen de la placa escaneada (formato base64)
      sharedMetadata: Metadata[] // Metadatos comunes a todos los espectros de la placa
    }
    spectrums: SpectrumData[] // Informacion sobre de cada espectro
    plateMetadata: PlateMetadata // Informacion de los metadatos de la placa
  }
}

export interface StepGeneralInfoForm {
  state: "NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE"
}

export interface StepSpecificInfoForm {
  states: null // Todavia no se dividio la cantidad de espectros
  | ("NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE")[] // Indexado numero de espectro
}

interface Metadata {
  key: string
  value: string | number | Date
}

export interface SpectrumData {
  id: number
  name: string
  spectrumBoundingBox: BoundingBox
  partsBoundingBoxes: {
    lamp1: BoundingBox | null
    lamp2: BoundingBox | null
    science: BoundingBox | null
  }
}
