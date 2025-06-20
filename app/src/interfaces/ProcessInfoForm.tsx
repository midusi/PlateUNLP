import type { BoxMetadata } from "@/components/molecules/BoxMetadataForm"
import type { PlateMetadata } from "@/components/molecules/PlateMetadataForm"
import type { BoundingBox } from "./BoundingBox"

export interface ProcessInfoForm {
  /** Info estado de procesado de cada etapa de la barra de navegación */
  processingStatus: {
    /** Etapas compartidas por toda la placas */
    generalSteps: StepGeneralInfoForm[]
    /** Etapas especificas para cada espectro */
    specificSteps: StepSpecificInfoForm[]
  }
  /** Informacion de la placa actual, imagen, metadatos, ... */
  data: {
    /** Datos relacionados especificamente a la placa. */
    plate: {
      /** Imagen de la placa escaneada (formato base64) */
      scanImage: string | null
      /** Metadatos comunes a todos los espectros de la placa. */
      sharedMetadata: PlateMetadata
    }
    /** Informacion sobre de cada espectro de la placa en cuestion. */
    spectrums: SpectrumData[]
  }
}

export interface StepGeneralInfoForm {
  state: "NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE"
}

export interface StepSpecificInfoForm {
  states:
    | null // Todavia no se dividio la cantidad de espectros
    | ("NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE")[] // Indexado numero de espectro
}

/** Interfaz que define los elementos que se deben conocer de un espectro. */
export interface SpectrumData {
  /** Identificacdor Unico, util para DB */
  id: number
  /** Nombre del espectro. */
  name: string
  /** Bounding Box que delimita las dimensiones y localización del espectro. */
  spectrumBoundingBox: BoundingBox
  /** Metadatos comunes a esta observación. */
  metadata: BoxMetadata | null
  /** Informacion respecto a las partes del espectro (science, lamp1, lamp2) */
  parts: {
    /** Información relacionada a la lampara de comparación 1. */
    lamp1: SpectrumPartData
    /** Información relacionada a la lampara de comparación 2. */
    lamp2: SpectrumPartData
    /** Información relacionada al espectro de ciencia. */
    science: SpectrumPartData
  }
}

/** Información de una parte especifica de un espectro. */
export interface SpectrumPartData {
  /**
   * Bounding Box que delimita las dimensiones y localización del espectro
   * de la lampara de comparación Nº1.
   */
  boundingBox: BoundingBox | null
  /**
   * Espectro extraido en forma de arreglo de intensidad para cada pixel
   * horizontal
   */
  extractedSpectrum: number[] | null
}
