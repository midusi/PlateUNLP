import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import * as tf from "@tensorflow/tfjs"
import { spectrum } from "db/schema/spectrum"
import { useEffect, useRef, useState } from "react"
import type z from "zod"
import { Card, CardContent, CardFooter } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import { extractScience, type extractSpectrumResponse } from "~/lib/extract-features"
import { notifyError } from "~/lib/notifications"
import { type AnalysisSchema, ExtractionConfigurationSchema } from "~/types/spectrum-metadata"
import type { getSpectrums } from "../-actions/get-spectrums"
import { updateSpectrumsExtractData } from "../-actions/update-spectrums-extract-data"
import { cropSpectrum } from "../-utils/crop-spectrum-from-observation"
import { maskingObservation } from "../-utils/mask-observation"

interface Spectrum {
  type: "lamp" | "science"
  id: string
  imageTop: number
  imageLeft: number
  imageWidth: number
  imageHeight: number
}

export function SpectrumsFeatures({
  observationId,
  initialSpectrums,
  observationTensor,
}: {
  /** Id de la observacion */
  observationId: string
  /** Arreglo con especificaciones de espectros de la observacion */
  initialSpectrums: Awaited<ReturnType<typeof getSpectrums>>
  /** Tensor 2D que representa la imagen recibida en escala de grises */
  observationTensor: tf.Tensor2D
}) {

  /**
   * Valores iniciales para el formulario de extraccion
   * Si no hay arreglos iniciales entonces se agrega una configuracion default.
   */
  const firstSpec = initialSpectrums[0] ?? null
  const defaultValues: z.output<typeof ExtractionConfigurationSchema> = {
    countMediasPoints: firstSpec ? firstSpec.countMediasPoints : 5,
    apertureCoefficient: firstSpec ? firstSpec.apertureCoefficient : 1.0,
    spectrums: initialSpectrums,
    cachedData: [],
  }

  const form = useAppForm({
    /** Se usa la configuracion del 1er espectro */
    defaultValues: defaultValues,
    validators: { onChange: ExtractionConfigurationSchema },
    onSubmit: async ({ value, formApi }) => {
      if (value.spectrums.length <= 0) return
      try {
        /** Revisar si algo cambio y si es asi actualizar los graficos */
        const analysisArr = recalculateGraphs(
          value.spectrums,
          value.cachedData,
          value.countMediasPoints,
          value.apertureCoefficient,
        )

        if (analysisArr.length > 0) {
          const newCachedData = value.spectrums
            .map((s) => {
              const newAnalysis = analysisArr.find((a) => a.spectrumId === s.id)?.analysis
              if (newAnalysis) {
                return {
                  spectrumId: s.id,
                  ...s,
                  analysis: { ...newAnalysis },
                }
              }

              const cachedAnalysis = value.cachedData.find((cd) => cd.spectrumId === s.id)
              if (cachedAnalysis) {
                return { ...cachedAnalysis }
              }

              /** Si no está ni en analysisArr ni en cachedData, se descarta */
              return null
            })
            .filter((cd): cd is NonNullable<typeof cd> => cd !== null)
          formApi.setFieldValue("cachedData", newCachedData)
        }

        /**
         * Actualizar parametros de todos los espectros en la DB
         */
        const pmp = prevFormValues.current.countMediasPoints
        const pac = prevFormValues.current.apertureCoefficient
        await updateSpectrumsExtractData({
          data: value.spectrums.map((s) => {
            const newCMP = pmp !== value.countMediasPoints ? value.countMediasPoints : undefined
            const newAC = pac !== value.apertureCoefficient ? value.apertureCoefficient : undefined
            const newIA = analysisArr.find((sia) => sia.spectrumId === s.id)?.analysis.intensityArr
            return {
              spectrumId: s.id,
              type: s.type,
              countMediasPoints: newCMP,
              apertureCoefficient: newAC,
              intensityArr: newIA,
            }
          }),
        })

        //router.invalidate();
        // formApi.reset(value);
      } catch (error) {
        notifyError("Failed to update spectrum extraction configuration", error)
      }
    },
    listeners: {
      onMount: ({ formApi }) => {
        /** Si el formulario es valido realiza Submit para autoguardado */
        if (formApi.state.isValid) {
          formApi.handleSubmit()
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

  /** Actualizar valores de espectros del formulario cada que cambian */
  useEffect(() => {
    //if (!observationTensor) return;
    form.setFieldValue("spectrums", initialSpectrums)
  }, [
    initialSpectrums,
    //observationTensor, //spectrumsData,
    form.setFieldValue,
  ])

  /** Registro temporal de valores previos */
  const prevFormValues = useRef<{ 
    countMediasPoints: number; 
    apertureCoefficient: number, 
    spectrumsMask: {spectrumId:string, mask: tf.Tensor4D}[] 
  }>({
    ...defaultValues, spectrumsMask:[]
  })

  /** Mutacion para actualizar tipos en la DB */
  const router = useRouter()
  const changeTypeMut = useMutation({
    mutationFn: async (params: { spectrumId: string; type: "lamp" | "science" }) => {
      /** Actualizar espectro objetivo */
      let changeArray: { spectrumId: string; type: "lamp" | "science" }[] = [
        {
          spectrumId: params.spectrumId,
          type: params.type,
        },
      ]
      /** Si el espectro se cambia a 'science' entonces los demas 'science' se cambian a 'lamp' */
      if (params.type === "science") {
        changeArray = [
          ...changeArray,
          ...initialSpectrums
            .filter((s) => s.type === "science")
            .map((s) => ({
              spectrumId: s.id,
              type: "lamp" as const,
            })),
        ]
      }
      /** Actualizar en la DB */
      await updateSpectrumsExtractData({ data: changeArray })
      /**
       * Forzar la actualizacion de demas componenetes en base al cambio
       * de la db
       */
      router.invalidate()
    },
    onError: (error) => notifyError("Error changing type of spectrum", error),
  })

  /**
   * Recalcula la informacion de los espectros de ciencia 1D (si es necesario)
   * y actualiza variables de estado.
   * @returns {{spectrumId: string; intensityArr: number[];}[] | undefined}
   * - Arreglo 1D para cada espectro en caso de poder calcularlo.
   */
  function recalculateGraphs(
    spectrums: Spectrum[],
    cachedData: z.infer<typeof AnalysisSchema>[],
    countCheckpoints: number,
    percentAperture: number,
  ) {
    /** Imagen de observacion a Tensor4D Grey [1, H, W, 1] */
    let obsTensor = observationTensor.expandDims(0).expandDims(-1) as tf.Tensor4D
    /** Tensor de zeros, persistir informacion de mascaras. */
    const zeros = tf.zerosLike(obsTensor)

    /** Arreglo con informacion cacheada */
    let spectrumsDataCached = [...cachedData]

    /**
     * Filtrar espectros que no cambiaron
     * Si cambio un parametro de configuracion hay que recalcular todo.
     * Si cambio el espectro de ciencia hay que recalcular todo.
     * Si cambio la bounding boxes de un espectro solo hay que recalcular esta
     * Si no hay informacion guardada de un espectro hay que calcularla.
     */
    const scienceChanged =
      spectrums.find((is) => is.type === "science")?.id !==
      spectrumsDataCached.find((sd) => sd.type === "science")?.spectrumId
    let spectrumsToRecalculate: Spectrum[]
    if (
      scienceChanged ||
      prevFormValues.current.countMediasPoints !== countCheckpoints ||
      prevFormValues.current.apertureCoefficient !== percentAperture
    ) {
      spectrumsToRecalculate = [...spectrums]
    } else {
      spectrumsToRecalculate = spectrums.filter((spec) => {
        const saved = spectrumsDataCached.find((sd) => sd.spectrumId === spec.id)
        return (
          !saved ||
          spec.type !== saved.type ||
          spec.imageTop !== saved.imageTop ||
          spec.imageLeft !== saved.imageLeft ||
          spec.imageWidth !== saved.imageWidth ||
          spec.imageHeight !== saved.imageHeight
        )
      })
    }
    /** Si nada cambio no hay nada que recalcular */
    if (spectrumsToRecalculate.length === 0) return []

    /**
     * Si hay espectros que no sufrieron cambios entoces se
     * parchean sus regiones en la imagen de la observacion
     */
    const persistentSpectrums = spectrums.filter(
      (is) => !spectrumsToRecalculate.some((tr) => tr.id === is.id),
    )
    for (const spect of persistentSpectrums) {
      const cachedInfo = spectrumsDataCached.find((sdc) => sdc.spectrumId === spect.id) as z.infer<
        typeof AnalysisSchema
      >
      const mask =  prevFormValues.current.spectrumsMask.find(m => m.spectrumId === spect.id)!.mask // [1, imageH, imageW, 1]
      obsTensor = maskingObservation(obsTensor, zeros, cachedInfo, mask)
    }

    /** Para guardar la funcion de ajuste del espectro de ciencia */
    let spectrumRectFunction: (value: number) => number
    /** Para guardar la funcion de derivacion del espectro de ciencia */
    let spectrumDerivedFunction: (value: number) => number

    /** Si ciencia cambio procesar el nuevo science */
    const masks: {spectrumId:string, mask:tf.Tensor4D}[] = []
    const specScience = spectrumsToRecalculate.find((s) => s.type === "science") as Spectrum
    const specsLamps = spectrumsToRecalculate.filter((s) => s.id !== specScience.id)
    if (specScience) {
      /** Subimagen que corresponde al espectro science */
      const spectrumTensor = cropSpectrum(obsTensor, specScience)
      /** Extraer caracteristicas */
      const useSpline = false
      const segmentWidth = 100
      const [_batch, height, width, _channels] = spectrumTensor.shape
      const result: extractSpectrumResponse = extractScience({
        science: spectrumTensor,
        width: width,
        height: height,
        countCheckpoints,
        percentAperture,
        segmentWidth: segmentWidth,
        fitFunction: useSpline ? "spline" : "linal-regression",
      })
      /** Actualizar datos para que los usen los que siguen */
      spectrumRectFunction = result.rectFunction
      spectrumDerivedFunction = result.derivedFunction
      masks.push({
        spectrumId: specScience.id,
        mask: result.spectrumMask
      })
      /** Actualizar cache del espectro */
      spectrumsDataCached = [
        ...spectrumsDataCached.filter((s) => s.spectrumId !== specScience.id),
        {
          spectrumId: specScience.id,
          ...specScience,
          analysis: {
            ...result,
            intensityArr: result.transversalAvgs,
          },
        },
      ]
    } else {
      /** Si no cambio ciencia -> recuperar de funciones datos de cache */
      const scienceCached = spectrumsDataCached.find((s) => s.type === "science")
      if (scienceCached) {
        spectrumRectFunction = scienceCached.analysis.rectFunction as (value: number) => number
        spectrumDerivedFunction = scienceCached.analysis.derivedFunction as (
          value: number,
        ) => number
      } else {
        /** Si no hay datos de ciencia cacheados entonces notifica y se retira */
        notifyError("A spectrum must be of a 'sciece' type.")
        return []
      }
    }

    /** Procesar demas espectros del listado */
    for (const spectrum of specsLamps) {
      /** Subimagen que corresponde al espectro en forma de tensor */
      const spectrumTensor = cropSpectrum(obsTensor, spectrum)

      /** Extraer caracteristicas */
      const useSpline = false
      const segmentWidth = 100
      const [_batch, height, width, _channels] = spectrumTensor.shape
      const result: extractSpectrumResponse = extractScience({
        science: spectrumTensor,
        width: width,
        height: height,
        countCheckpoints,
        percentAperture,
        segmentWidth: segmentWidth,
        fitFunction: useSpline ? "spline" : "linal-regression",
        baseRectFunction: spectrumRectFunction,
        baseDerivedFunction: spectrumDerivedFunction,
      })

      /** Actualizar cache del espectro */
      masks.push({
        spectrumId: spectrum.id,
        mask: result.spectrumMask
      })
      spectrumsDataCached = [
        ...spectrumsDataCached.filter((s) => s.spectrumId !== spectrum.id),
        {
          spectrumId: spectrum.id,
          ...spectrum,
          analysis: {
            ...result,
            intensityArr: result.transversalAvgs,
          },
        },
      ]
    }

    /** Actualizar datos de estado. */
    spectrumsDataCached.sort(
      /** Orden: arriba -> abajo & izquierda -> derecha */
      (a, b) => a.imageTop - b.imageTop || a.imageLeft - b.imageLeft,
    )

    /** Actualiza los ultimos valores usados */
    prevFormValues.current = {
      countMediasPoints: countCheckpoints,
      apertureCoefficient: percentAperture,
      spectrumsMask: masks,
    }

    /** Retorna el analisis de los cada espectro que cambio */
    return spectrumsDataCached
  }

  return (
    <Card>
      <CardContent>
        <div id="spectrum-extraction-controls" className="mb-4 flex gap-10">
          <form.AppField name="spectrums">
            {(field) => { 
              const errors = field.getMeta().errors
              return errors && errors.length > 0 && <span>{errors[0].message}</span>
            }}
          </form.AppField>
          <form.AppField name="countMediasPoints">
            {(field) => (
              <field.RangeField
                label="Count checkpoints"
                //disabled={state !== "ready"}
                min={2}
                max={20}
                step={1}
              />
            )}
          </form.AppField>
          <form.AppField name="apertureCoefficient">
            {(field) => (
              <field.RangeField
                label="Aperture Percentage"
                //disabled={state !== "ready"}
                min={0.7}
                max={1.3}
                step={0.1}
              />
            )}
          </form.AppField>
        </div>
        <hr />
        <div style={{ minHeight: "300px" }} className="flex flex-col items-center justify-center ">
          <form.AppField name="spectrums">
            {(field) => (
              <field.SpectrumsVisorField
                observationId={observationId}
                changeType={(spectrumId: string, type: "lamp" | "science") =>
                  changeTypeMut.mutate({
                    spectrumId: spectrumId,
                    type: type,
                  })
                }
              />
            )}
          </form.AppField>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <form.Subscribe
          selector={(formState) => [formState.isValid, formState.isSubmitting, formState.isDirty]}
        >
          {([isValid, isSubmitting, isDirty]) => (
            <p className="flex items-center text-muted-foreground text-xs italic">
              {!isValid ? (
                <>
                  <span>Changes aren't beign saved! Please fix the errors above</span>
                  <span className="icon-[ph--warning-circle-bold] ml-1 size-3" />
                </>
              ) : isDirty ? (
                <>
                  <span>Correct the above errors</span>
                  <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                </>
              ) : isSubmitting ? (
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
      </CardFooter>
    </Card>
  )
}
