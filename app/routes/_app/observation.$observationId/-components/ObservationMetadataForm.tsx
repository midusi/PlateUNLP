import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import type { z } from "zod"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter } from "~/components/ui/card"
import { useAppForm } from "~/hooks/use-app-form"
import { notifyError } from "~/lib/notifications"
import { ObservationMetadataSchema } from "~/types/spectrum-metadata"
import { updateObservationMetadata } from "../-actions/update-observation-metadata"

export function ObservationMetadataForm({
  observationId,
  defaultValues,
}: {
  observationId: string
  defaultValues: z.output<typeof ObservationMetadataSchema>
}) {
  const router = useRouter()

  const formCalculate = useAppForm({
    defaultValues,
    validators: { onChange: ObservationMetadataSchema },
    onSubmit: async ({ value }) => {
      try {
        await updateObservationMetadata({ data: { observationId, metadata: value } })
      } catch (error) {
        notifyError("Failed to update observation metadata", error)
      }
    },
  })

  const form = useAppForm({
    defaultValues,
    validators: { onChange: ObservationMetadataSchema },
    onSubmit: async ({ value }) => {
      try {
        await updateObservationMetadata({ data: { observationId, metadata: value } })
      } catch (error) {
        notifyError("Failed to update observation metadata", error)
      }
    },
  })

  /** Calculo de metadatos */
  const calcaulateMetadataMut = useMutation({
    mutationFn: async () => {
      /** Logica de calculo de metadatos y actualización de parametros */
      notifyError("Not implemented yet")
    },
    onError: (error) => notifyError("Error calculating spectrum metadata", error),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <Card>
        <CardContent>
          <div className="grid grid-cols-3 justify-center content-normal gap-4">
            <form.AppField name="OBJECT">
              {(field) => (
                <field.TextField label="OBJECT" placeholder="Name of the object observed" />
              )}
            </form.AppField>
            <form.AppField name="DATE-OBS">
              {(field) => (
                <field.TextField label="DATE-OBS" placeholder="Date of observation (yyyy-mm-dd)" />
              )}
            </form.AppField>
            <form.AppField name="UT">
              {(field) => (
                <field.TextField
                  label="UT"
                  placeholder="Universal time (hh:mm:ss) corresponding to half of the exposure duration"
                />
              )}
            </form.AppField>

            <div />
            <div />
            <Button
              disabled={calcaulateMetadataMut.isPending}
              onClick={() => calcaulateMetadataMut.mutate()}
            >
              <span
                className={
                  calcaulateMetadataMut.isPending
                    ? "icon-[ph--spinner-bold] animate-spin"
                    : "icon-[ph--floppy-disk-bold]"
                }
              />
              Update Metadata
            </Button>

            <hr className="col-span-full" />

            <form.AppField name="MAIN-ID">
              {(field) => (
                <field.TextField label="MAIN-ID" placeholder="Simbad main ID object name" />
              )}
            </form.AppField>
            <form.AppField name="TIME-OBS">
              {(field) => (
                <field.TextField
                  label="TIME-OBS"
                  placeholder="Local time at the start of the observation"
                />
              )}
            </form.AppField>
            <form.AppField name="ST">
              {(field) => <field.TextField label="ST" placeholder="Local mean sidereal time" />}
            </form.AppField>

            <form.AppField name="HA">
              {(field) => <field.TextField label="HA" placeholder="Hour angle" />}
            </form.AppField>
            <form.AppField name="RA">
              {(field) => <field.TextField label="RA" placeholder="Right ascension" />}
            </form.AppField>
            <form.AppField name="DEC">
              {(field) => <field.TextField label="DEC" placeholder="Declination" />}
            </form.AppField>

            <form.AppField name="GAIN">
              {(field) => <field.TextField label="GAIN" placeholder="Gain, electrons per adu" />}
            </form.AppField>
            <form.AppField name="RA2000">
              {(field) => (
                <field.TextField label="RA2000" placeholder="Right ascension ICRS J2000" />
              )}
            </form.AppField>
            <form.AppField name="DEC2000">
              {(field) => <field.TextField label="DEC2000" placeholder="Declination ICRS J2000" />}
            </form.AppField>

            <form.AppField name="RA1950">
              {(field) => <field.TextField label="RA1950" placeholder="Right ascension FK4" />}
            </form.AppField>
            <form.AppField name="DEC1950">
              {(field) => <field.TextField label="DEC1950" placeholder="Declination ICRS FK4" />}
            </form.AppField>
            <form.AppField name="EXPTIME">
              {(field) => (
                <field.TextField label="EXPTIME" placeholder="Integration time in seconds" />
              )}
            </form.AppField>

            <form.AppField name="DETECTOR">
              {(field) => (
                <field.TextField label="DETECTOR" placeholder="Instrument for detections" />
              )}
            </form.AppField>
            <form.AppField name="IMAGETYP">
              {(field) => (
                <field.TextField label="IMAGETYP" placeholder="Object, dark, zero, etc" />
              )}
            </form.AppField>
            <form.AppField name="SPTYPE">
              {(field) => <field.TextField label="SPTYPE" placeholder="Simbad spectral type" />}
            </form.AppField>

            <form.AppField name="JD">
              {(field) => <field.TextField label="JD" placeholder="Julian date" />}
            </form.AppField>
            <form.AppField name="EQUINOX">
              {(field) => <field.TextField label="EQUINOX" placeholder="Epoch of ra y dec" />}
            </form.AppField>
            <form.AppField name="AIRMASS">
              {(field) => <field.TextField label="AIRMASS" placeholder="Airmass" />}
            </form.AppField>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <form.Subscribe selector={(formState) => [formState.canSubmit, formState.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit}>
                <span
                  className={
                    isSubmitting
                      ? "icon-[ph--spinner-bold] animate-spin"
                      : "icon-[ph--floppy-disk-bold]"
                  }
                />
                Save
              </Button>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
    </form>
  )
}
