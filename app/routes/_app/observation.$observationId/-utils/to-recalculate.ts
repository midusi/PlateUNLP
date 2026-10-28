interface Spectrum {
  id: string
  type: "science" | "lamp"
  imageHeight: number
  imageLeft: number
  imageTop: number
  imageWidth: number
}
interface Spectrum {
  id: string
  type: "lamp" | "science"
  imageTop: number
  imageLeft: number
  imageWidth: number
  imageHeight: number
  countMediasPoints: number
  apertureCoefficient: number
  fitDegree: number
}

export function toRecalculate(
  actual: {
    spectrums: Spectrum[]
  },
  prev: {
    idPrincipalSpectrum: string
    spectrums: Spectrum[]
  },
) {
  /** Obtener espectro principal actual */
  const principalSpectrum = actual.spectrums.find((s) => s.type === "science")
  if (!principalSpectrum) throw new Error("The main spectrum is not specified")

  /** ¿Cambio el espectro principal, sus dimensiones, o sus parámetros de extracción? */
  let changePrincipalSpectrum = false
  
  if (principalSpectrum.id !== prev.idPrincipalSpectrum) {
    changePrincipalSpectrum = true
  } else {
    const prevPrincipalSpectrum = prev.spectrums.find((s) => s.id === principalSpectrum.id)
    if (!prevPrincipalSpectrum) {
      changePrincipalSpectrum = true
    } else {
      // Si cambia algo en el principal, se recalcula TODO porque las lámparas dependen de su traza
      changePrincipalSpectrum =
        prevPrincipalSpectrum.imageHeight !== principalSpectrum.imageHeight ||
        prevPrincipalSpectrum.imageLeft !== principalSpectrum.imageLeft ||
        prevPrincipalSpectrum.imageTop !== principalSpectrum.imageTop ||
        prevPrincipalSpectrum.imageWidth !== principalSpectrum.imageWidth ||
        prevPrincipalSpectrum.countMediasPoints !== principalSpectrum.countMediasPoints ||
        prevPrincipalSpectrum.apertureCoefficient !== principalSpectrum.apertureCoefficient ||
        prevPrincipalSpectrum.fitDegree !== principalSpectrum.fitDegree
    }
  }

  /**
   * Espectros a recalcular: si cambió la configuración del principal, entonces todos.
   * Si el principal sigue igual, solo los espectros individuales que hayan cambiado.
   */
  let recalculateArr: Spectrum[] = []
  
  if (changePrincipalSpectrum) {
    recalculateArr = actual.spectrums
  } else {
    recalculateArr = actual.spectrums.filter((s) => {
      const prevData = prev.spectrums.find((st) => st.id === s.id)
      
      // Si es un espectro nuevo
      if (!prevData) return true
      
      // Si cambiaron las dimensiones, la configuración individual o el tipo
      if (
        s.imageHeight !== prevData.imageHeight ||
        s.imageLeft !== prevData.imageLeft ||
        s.imageTop !== prevData.imageTop ||
        s.imageWidth !== prevData.imageWidth ||
        s.countMediasPoints !== prevData.countMediasPoints ||
        s.apertureCoefficient !== prevData.apertureCoefficient ||
        s.fitDegree !== prevData.fitDegree ||
        s.type !== prevData.type
      ) {
        return true
      }
      
      return false
    })
  }

  return {
    recalculateArr,
    changePrincipalSpectrum,
    idPrincipalSpectrum: principalSpectrum.id,
  }
}