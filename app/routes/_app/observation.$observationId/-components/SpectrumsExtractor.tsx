import { useQuery } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import type z from "zod"
import { useAppForm } from "~/hooks/use-app-form"
import { useXViewport } from "~/hooks/use-x-viewport"
import type { ExtractSpectrumResponse } from "~/lib/extract-features"
import { fetchGrayscaleImage } from "~/lib/image"
import { notifyError } from "~/lib/notifications"
import { ExtractionConfigurationSchema } from "~/types/spectrum-metadata"
import { getObservationExtractionConfiguration } from "../-actions/get-observation-extraction-configuration"
import type { getSpectrums } from "../-actions/get-spectrums"
import { updateSpectrum } from "../-actions/update-spectrum"
import { updateSpectrumsIntensityArr } from "../-actions/update-spectrums-intensity-arr"
import { updateSpectrumsTypes } from "../-actions/update-spectrums-types"
import type { MaskSource } from "../-utils/build-applied-mask-overlay"
import { recalculateSpectrums1D } from "../-utils/recalculate-spectrums-1d"
import { toRecalculate } from "../-utils/to-recalculate"
import { SpectrumCard } from "./SpectrumCard"
import { SpectrumCardSkeleton } from "./SpectrumCardSkeleton"

interface Spectrum {
  id: string
  type: "lamp" | "science"
  imageWidth: number
  imageHeight: number
  imageLeft: number
  imageTop: number
  imageAngle?: number | null
  countMediasPoints: number
  apertureCoefficient: number
  fitDegree: number
}
/** Referencia estable para los espectros sin mascaras previas. */
const NO_MASK_SOURCES: MaskSource[] = []

type SpectrumsExtractorProps = {
  /** Id de la observacion */
  observationId: string
  /** Arreglo con especificaciones de espectros de la observacion */
  spectrums: Awaited<ReturnType<typeof getSpectrums>>
  /** Se llama cuando las intensidades extraidas quedaron guardadas en la base */
  onExtracted?: () => void
}

export function SpectrumsExtractor({
  observationId,
  spectrums = [],
  onExtracted,
}: SpectrumsExtractorProps) {
  const router = useRouter()

  const { data: observationTensor } = useQuery({
    queryKey: ["observationImage", observationId],
    queryFn: async () => {
      const image = await fetchGrayscaleImage(`/api/observation/${observationId}/image`)
      return image
    },
  })

  const orderedSpectrums = useMemo(() => {
    return spectrums
      .map((s) => ({
        ...s,
        countMediasPoints: s.countMediasPoints ?? 5,
        apertureCoefficient: s.apertureCoefficient ?? 0.95,
        fitDegree: s.fitDegree ?? 1,
      }))
      .sort((a, b) => a.imageTop - b.imageTop || a.imageLeft - b.imageLeft)
  }, [spectrums])
  /**
   * Zoom compartido por todas las tarjetas: acercarse o desplazarse en una lo
   * hace en las demas. Una columna por valor del grafico 1D (el recorte se hace
   * con el ancho truncado); si los anchos difieren se usa el menor, para que el
   * rango sea valido en todas.
   */
  const sharedLength = orderedSpectrums.length
    ? Math.min(...orderedSpectrums.map((s) => Math.floor(s.imageWidth)))
    : 0
  const xViewport = useXViewport(sharedLength)
  /** Valores iniciales para el formulario de extraccion */
  const defaultValues: z.output<typeof ExtractionConfigurationSchema> = {
    spectrums: orderedSpectrums,
  }

  /** Estado del procesado */
  const [state, setState] = useState<"ready" | "running">("running")
  /** Almacenar informacion de si las variables estan listas */
  const [analysisArr, setAnalysisArr] = useState<
    { id: string; analysis: ExtractSpectrumResponse }[]
  >([])

  /**
   * Mascaras que ya estaban aplicadas cuando se extrajo cada espectro: el de
   * ciencia se extrae primero y despues el resto, en orden, y cada uno tapa su
   * apertura para los que siguen.
   */
  const maskSourcesById = useMemo(() => {
    const principal = orderedSpectrums.find((s) => s.type === "science")
    const extractionOrder = principal
      ? [principal, ...orderedSpectrums.filter((s) => s !== principal)]
      : orderedSpectrums
    const byId = new Map<string, MaskSource[]>()
    extractionOrder.forEach((target, position) => {
      const sources: MaskSource[] = []
      for (const source of extractionOrder.slice(0, position)) {
        const analysis = analysisArr.find((a) => a.id === source.id)?.analysis
        if (analysis) sources.push({ spectrum: source, mask: analysis.spectrumMask })
      }
      byId.set(target.id, sources)
    })
    return byId
  }, [orderedSpectrums, analysisArr])

  /** Registro temporal de valores previos */
  const prevFormValues = useRef<{
    spectrums: Spectrum[]
    idPrincipalSpectrum: string
  }>({
    spectrums: [],
    idPrincipalSpectrum: orderedSpectrums.find((s) => s.type === "science")?.id ?? "",
  })

  const form = useAppForm({
    defaultValues: defaultValues,
    validators: {
      onChange: ExtractionConfigurationSchema,
    },
    onSubmit: async ({ value }) => {
      if (!observationTensor) return
      try {
        setState("running")
        /** Averiguar que espectros del listado deben ser recalculados */
        const { recalculateArr, changePrincipalSpectrum, idPrincipalSpectrum } = toRecalculate(
          value,
          prevFormValues.current,
        )

        /** Espectros de la pasada anterior, antes de actualizar el registro. */
        const prevSpectrums = prevFormValues.current.spectrums

        /** Realizar analisis */
        let newAnalysis: {
          id: string
          analysis: ExtractSpectrumResponse
        }[] = []
        if (recalculateArr.length > 0) {
          newAnalysis = recalculateSpectrums1D(
            observationTensor,
            recalculateArr,
            prevFormValues.current.spectrums,
            idPrincipalSpectrum,
            analysisArr,
          )
          /** Actualizar informacion de analisis guardada en estado */
          const newAnalysisArr = analysisArr
            .filter(
              (a) =>
                value.spectrums.some((s) => a.id === s.id) &&
                newAnalysis.every((s) => a.id !== s.id),
            )
            .concat(newAnalysis)
          analysisArr /** Olvidar tensores de espectros que ya no se usan */
            .filter((a) => value.spectrums.every((s) => a.id !== s.id))
            .forEach((s) => void s.analysis.spectrumMask.dispose())
          setAnalysisArr(newAnalysisArr)
        }

        /**
         * Actualizar registros para detectar futuros cambios. Se hace antes de guardar:
         * si el guardado falla, la proxima pasada no debe tratar todo como nuevo (eso
         * invalida el router, vuelve a llegar la lista de espectros y reinicia el ciclo).
         */
        if (changePrincipalSpectrum) {
          prevFormValues.current.idPrincipalSpectrum = idPrincipalSpectrum
        }
        prevFormValues.current.spectrums = value.spectrums

        await Promise.all(
          value.spectrums.map((spectrum) =>
            updateSpectrum({
              data: {
                spectrumId: spectrum.id,
                countMediasPoints: spectrum.countMediasPoints,
                apertureCoefficient: spectrum.apertureCoefficient,
                fitDegree: spectrum.fitDegree,
                type: spectrum.type,
              },
            }),
          ),
        )

        /** Si los tipos de los espectros cambiaron los actualiza */
        if (changePrincipalSpectrum) {
          let typesWhoChanged = []
          if (prevSpectrums.length <= 0) {
            typesWhoChanged = value.spectrums
          } else {
            typesWhoChanged = value.spectrums.filter(
              (s, idx) => s.type !== prevSpectrums[idx].type,
            )
          }

          if (typesWhoChanged.length > 0) {
            await updateSpectrumsTypes({ data: typesWhoChanged })
            await router.invalidate() // Solo recarga si realmente se invirtieron los roles
          }
        }

        /** Si cambio el arreglo de intensidades de un espectro se actualiza */
        if (newAnalysis.length > 0) {
          await updateSpectrumsIntensityArr({
            data: newAnalysis.map((a) => ({
              id: a.id,
              intensityArr: a.analysis.transversalAvgs,
            })),
          })
          onExtracted?.()
        }

        /** Avisar fin del procesado */
        setState("ready")
      } catch (error) {
        if (error instanceof Error && error.message !== "The main spectrum is not specified") {
          notifyError("Failed to update spectrum extraction configuration", error)
        }
      }
    },
    listeners: {
      onMount: async ({ formApi }) => {
        try {
          const result = await getObservationExtractionConfiguration({
            data: { observationId },
          })
          if (!result) {
            notifyError("The required observation does not exist", "")
          }
          formApi.handleSubmit()
        } catch (error) {
          notifyError(
            "Something happens bad with database interactionSomething went wrong with the interaction with the database.",
            error,
          )
        }
      },
      onChange: ({ formApi }) => {
        /** Si el formulario es valido realiza Submit para autoguardado */
        if (formApi.state.isValid) {
          formApi.handleSubmit()
        }
      },
      /**
       * Retrazar la actualizacion de cambios por lo menos 500 ml de
       * la ultima modificacion del usuario del formulario
       */
      onChangeDebounceMs: 500,
    },
  })

  /** Liberar los tensores de los analisis al desmontar (el extractor se remonta al cambiar los espectros). */
  const analysisArrRef = useRef(analysisArr)
  analysisArrRef.current = analysisArr
  useEffect(() => {
    return () => {
      for (const { analysis } of analysisArrRef.current) analysis.spectrumMask.dispose()
    }
  }, [])

  useEffect(() => {
    form.setFieldValue("spectrums", orderedSpectrums)
    if (observationTensor) {
      form.handleSubmit()
    }
  }, [orderedSpectrums, observationTensor, form.setFieldValue, form.handleSubmit])

  return (
    <div className="flex flex-col gap-4">
      <form.Field name="spectrums" mode="array">
        {(spectrumsField) => {
          const spectrumsArr = spectrumsField.state.value
          const scienceCount = spectrumsArr.filter((s) => s.type === "science").length
          if (!spectrumsArr.length) {
            return <p className="text-muted-foreground text-sm">Waiting definition of spectrums</p>
          }
          return spectrumsArr.map((item, idx) => {
            const spec = spectrums.find((s) => s.id === item.id)
            if (!spec) {
              return (
                <p key={item.id} className="text-muted-foreground text-sm">
                  Spectrum image not found
                </p>
              )
            }
            const analysis = analysisArr.find((a) => a.id === item.id)?.analysis
            /**
             * Sin analisis, o con uno de otro ancho (el recorte cambio y todavia no se
             * recalculo), se muestra el esqueleto. En cualquier otro recalculo la
             * tarjeta sigue montada, asi se conserva el zoom que tenga.
             */
            if (!analysis || analysis.transversalAvgs.length !== Math.floor(spec.imageWidth)) {
              return <SpectrumCardSkeleton key={item.id} />
            }
            return (
              <SpectrumCard
                key={item.id}
                form={form}
                index={idx}
                observationId={observationId}
                spectrum={spec}
                analysis={analysis}
                type={item.type}
                scienceCount={scienceCount}
                isCalculating={state === "running"}
                maskSources={maskSourcesById.get(item.id) ?? NO_MASK_SOURCES}
                xViewport={xViewport}
              />
            )
          })
        }}
      </form.Field>
      <form.Subscribe selector={(formState) => [formState.isValid, formState.isSubmitting]}>
        {([isValid, isSubmitting, isDirty]) => (
          <p className="flex items-center justify-end text-muted-foreground text-xs italic">
            {!isValid ? (
              <>
                <span>Changes aren't beign saved! Please fix the errors above</span>
                <span className="icon-[ph--warning-circle-bold] ml-1 size-3" />
              </>
            ) : isSubmitting || isDirty ? (
              <>
                <span>Calculating spectral vectors...</span>
                <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
              </>
            ) : (
              <>
                <span>Extraction configuration saved on database</span>
                <span className="icon-[ph--cloud-arrow-up-bold] ml-1 size-3" />
              </>
            )}
          </p>
        )}
      </form.Subscribe>
    </div>
  )
}
