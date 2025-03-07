export interface ProcessInfoForm {
  general: StepGeneralInfoForm[] // Info etapas que realizar por cada placa
  perSpectrum: StepSpecificInfoForm[] // Info etapas que realizar por cada espectro
  spectrums: SpectrumData[] // Informacion sobre el estado de cada espectro
}

export interface StepGeneralInfoForm {
  state: "NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE"
}

export interface StepSpecificInfoForm {
  states: null // Todavia no se dividio la cantidad de espectros
    | ("NOT_REACHED" | "NECESSARY_CHANGES" | "COMPLETE")[] // Indexado numero de espectro
}

export interface SpectrumData {
  id: number
  name: string
  image: string
  images: {
    lamps: string[]
    scienceSpectrum: string
  }
}
