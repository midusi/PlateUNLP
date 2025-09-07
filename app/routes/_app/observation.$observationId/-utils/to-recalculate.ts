interface Spectrum {
  id: string
  type: "science" | "lamp"
  imageHeight: number
  imageLeft: number
  imageTop: number
  imageWidth: number
}

/**
 * Funcion que encapsula la logica de decicion para decidir si el analisis
 * de un espectro debe ser recalculado o no.
 * @param actual - Arreglo con todos los espectros actuales
 * @param prev - Arreglo con todos los espectros tal como se los conocia
 * en la iteracion anterior.
 * @returns - Arreglo de espectros que deben ser recalculados.
 */
export function toRecalculate(
  actual: {
    countMediasPoints: number
    apertureCoefficient: number
    spectrums: Spectrum[]
  },
  prev: {
    idPrincipalSpectrum: string
    countMediasPoints: number
    apertureCoefficient: number
    spectrums: Spectrum[]
  },
) {
  /** ¿Cambio la cantidad de puntos medios? */
  const changeMediasPoints = actual.countMediasPoints !== prev.countMediasPoints
  /** ¿Cambio el coeficiente de apertura? */
  const changeApertureCoefficient = actual.apertureCoefficient !== prev.apertureCoefficient
  /** ¿Cambio el espectro principal o sus dimensiones? */
  let changePrincipalSpectrum: boolean
  const principalSpectrum = actual.spectrums.find((s) => s.type === "science")
  if (!principalSpectrum) changePrincipalSpectrum = true
  else {
    changePrincipalSpectrum = principalSpectrum.id !== prev.idPrincipalSpectrum
    if (!changePrincipalSpectrum) {
      const prevPrincipalSpectrum = prev.spectrums.find((s) => s.id === prev.idPrincipalSpectrum)
      if (!prevPrincipalSpectrum) {
        changePrincipalSpectrum = true
      } else {
        changePrincipalSpectrum =
          prevPrincipalSpectrum.imageHeight !== principalSpectrum.imageHeight ||
          prevPrincipalSpectrum.imageLeft !== principalSpectrum.imageLeft ||
          prevPrincipalSpectrum.imageTop !== principalSpectrum.imageTop ||
          prevPrincipalSpectrum.imageWidth !== principalSpectrum.imageWidth
      }
    }
  }

  /**
   * Espectros a recalcular, si cambio la configuracion entonces todos
   * si solo cambiaron las dimensiones algun espectro no principal
   */
  let recalculateArr: Spectrum[] = []
  if (!principalSpectrum) throw new Error("The main spectrum is not specified")
  if (changeMediasPoints || changeApertureCoefficient || changePrincipalSpectrum) {
    recalculateArr = actual.spectrums
  } else {
    recalculateArr = actual.spectrums.filter((s) => {
      const prevData = prev.spectrums.find((st) => st.id === s.id)
      if (!prevData) return true
      if (
        s.imageHeight !== prevData.imageHeight ||
        s.imageLeft !== prevData.imageLeft ||
        s.imageTop !== prevData.imageTop ||
        s.imageWidth !== prevData.imageWidth
      )
        return true
      return false
    })
  }

  return {
    recalculateArr: recalculateArr,
    changeMediasPoints: changeMediasPoints,
    changeApertureCoefficient: changeApertureCoefficient,
    changePrincipalSpectrum: changePrincipalSpectrum,
    idPrincipalSpectrum: principalSpectrum.id,
  }
}
