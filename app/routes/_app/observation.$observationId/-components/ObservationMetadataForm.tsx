import { Collapsible } from "@base-ui-components/react/collapsible"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import type { z } from "zod"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Separator } from "~/components/ui/separator"
import { useAppForm } from "~/hooks/use-app-form"
import { notifyError } from "~/lib/notifications"
import { cn } from "~/lib/utils"
import { ObservationMetadataSchema } from "~/types/spectrum-metadata"
import { computeObservationMetadata } from "../-actions/compute-observation-metadata"
import { updateObservationMetadata } from "../-actions/update-observation-metadata"

export function ObservationMetadataForm({
  observationId,
  OBSERVAT,
  defaultValues,
}: {
  observationId: string
  OBSERVAT: string
  defaultValues: z.output<typeof ObservationMetadataSchema>
}) {
  const router = useRouter()

  const form = useAppForm({
    defaultValues,
    validators: { onChange: ObservationMetadataSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await updateObservationMetadata({ data: { observationId, metadata: value } })
        formApi.reset(value)
      } catch (error) {
        notifyError("Failed to update observation metadata", error)
      }
    },
    listeners: {
      onChange: ({ formApi }) => {
        // autosave logic
        if (formApi.state.isValid) {
          formApi.handleSubmit()
        }
      },
      onChangeDebounceMs: 500,
    },
  })

  const { mutate: computeMetadata, isPending: isComputingMetadata } = useMutation({
    mutationFn: async () => {
      try {
        const result = await computeObservationMetadata({
          data: { ...form.state.values, OBSERVAT },
        })
        form.setFieldValue("OBJECT", result.OBJECT)
        form.setFieldValue("DATE-OBS", result["DATE-OBS"])
        form.setFieldValue("UT", result.UT)
        form.setFieldValue("MAIN-ID", result["MAIN-ID"])
        form.setFieldValue("SPTYPE", result.SPTYPE)
        form.setFieldValue("RA", result.RA)
        form.setFieldValue("DEC", result.DEC)
        form.setFieldValue("EQUINOX", result.EQUINOX)
        form.setFieldValue("RA2000", result.RA2000)
        form.setFieldValue("DEC2000", result.DEC2000)
        form.setFieldValue("RA1950", result.RA1950)
        form.setFieldValue("DEC1950", result.DEC1950)
        form.setFieldValue("TIME-OBS", result["TIME-OBS"])
        form.setFieldValue("JD", result.JD)
        form.setFieldValue("ST", result.ST)
        form.setFieldValue("HA", result.HA)
        form.setFieldValue("AIRMASS", result.AIRMASS)
      } catch (error) {
        notifyError("Failed to compute observation metadata", error)
      }
    },
  })

  return (
    <Collapsible.Root defaultOpen={true}>
      <Card className="gap-0">
        <CardHeader className="flex items-center gap-4">
          <CardTitle className="grow">Observation metadata</CardTitle>
          <form.Subscribe
            selector={(state) => {
              let filled = 0
              let total = 0
              for (const key in ObservationMetadataSchema.shape) {
                if (key in state.values) {
                  filled +=
                    typeof state.values[key] === "string" && state.values[key].trim() ? 1 : 0
                  total += 1
                }
              }
              return [filled, total] as const
            }}
          >
            {([filled, total]) => (
              <div className="flex items-center justify-end gap-2">
                <span className="text-muted-foreground text-sm">
                  {filled}/{total}
                </span>
                <Progress value={(100 * filled) / total} className="w-16" />
              </div>
            )}
          </form.Subscribe>
          <Collapsible.Trigger className="group">
            <span className="icon-[ph--caret-left-bold] group-data-[panel-open]:-rotate-90 size-5 transition-all ease-out" />
          </Collapsible.Trigger>
        </CardHeader>
        <Collapsible.Panel
          className={cn(
            "h-(--collapsible-panel-height) transition-all ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 data-[ending-style]:overflow-hidden data-[starting-style]:overflow-hidden",
            "mt-4 flex flex-col gap-6",
          )}
          render={
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // form.handleSubmit() ignore, autosaves on change
              }}
            />
          }
        >
          <Separator orientation="horizontal" />
          <CardContent className="grid grid-cols-3 items-start gap-4">
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
            <div className="relative col-span-full flex h-12 items-center justify-center">
              <Separator orientation="horizontal" className="absolute top-1/2" />
              <form.Subscribe
                selector={(formState) => [
                  formState.fieldMeta.OBJECT?.isValid &&
                    formState.fieldMeta["DATE-OBS"]?.isValid &&
                    formState.fieldMeta.UT?.isValid,
                ]}
              >
                {([isValid]) => (
                  <Button
                    className="z-10"
                    disabled={!isValid || isComputingMetadata}
                    onClick={() => computeMetadata()}
                  >
                    <span
                      className={
                        isComputingMetadata
                          ? "icon-[ph--spinner-bold] animate-spin"
                          : "icon-[ph--calculator-bold]"
                      }
                    />
                    Compute the rest of the metadata
                  </Button>
                )}
              </form.Subscribe>
            </div>

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
          </CardContent>
          <CardFooter className="flex justify-end">
            <form.Subscribe
              selector={(formState) => [
                formState.isValid,
                formState.isSubmitting,
                formState.isDirty,
              ]}
            >
              {([isValid, isSubmitting, isDirty]) => (
                <p className="flex items-center text-muted-foreground text-xs italic">
                  {!isValid ? (
                    <>
                      <span>Changes aren't beign saved! Please fix the errors above</span>
                      <span className="icon-[ph--warning-circle-bold] ml-1 size-3" />
                    </>
                  ) : isSubmitting || isDirty ? (
                    <>
                      <span>Saving changes...</span>
                      <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>Metadata saved on database</span>
                      <span className="icon-[ph--cloud-arrow-up-bold] ml-1 size-3" />
                    </>
                  )}
                </p>
              )}
            </form.Subscribe>
          </CardFooter>
        </Collapsible.Panel>
      </Card>
    </Collapsible.Root>
  )
}
