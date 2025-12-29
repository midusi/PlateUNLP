import { Collapsible } from "@base-ui/react/collapsible"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import type { z } from "zod"
import { SelectFieldSimpleWithKnown } from "~/components/forms/select-field-simple-with-known"
import { TextFieldWithKnown } from "~/components/forms/text-field-with-known"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Separator } from "~/components/ui/separator"
import { useAppForm } from "~/hooks/use-app-form"
import { notifyError } from "~/lib/notifications"
import { cn } from "~/lib/utils"
import {
  getObservationMetadataCompletion,
  ObservationMetadataSchema,
} from "~/types/spectrum-metadata"
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
        await updateObservationMetadata({
          data: { observationId, metadata: value },
        })
        if (
          value.OBJECT !== defaultValues.OBJECT ||
          value["DATE-OBS"] !== defaultValues["DATE-OBS"] ||
          value.UT !== defaultValues.UT
        ) {
          // If the observation id has changed, we need to update the route title
          router.invalidate()
        }
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
        form.handleSubmit()
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
          <form.Subscribe selector={(state) => getObservationMetadataCompletion(state.values)}>
            {({ completed, total, percentage }) => (
              <div className="flex items-center justify-end gap-2">
                <span className="text-muted-foreground text-sm">
                  {completed}/{total}
                </span>
                <Progress value={percentage} className="w-16" />
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
                <field.TextField
                  label="OBJECT"
                  placeholder="Name of the object observed"
                  description="* required to compute"
                />
              )}
            </form.AppField>
            <TextFieldWithKnown
              form={form}
              fields="DATE-OBS"
              label="DATE-OBS"
              placeholder="Date of observation (yyyy-mm-dd)"
              description="* required to compute"
            />
            <TextFieldWithKnown
              form={form}
              fields="UT"
              label="UT"
              placeholder="Universal time (hh:mm:ss) corresponding to half of the exposure duration"
              description="* required to compute"
            />

            <TextFieldWithKnown
              form={form}
              fields="EXPTIME"
              label="EXPTIME"
              placeholder="Integration time in seconds"
            />

            <SelectFieldSimpleWithKnown
              form={form}
              fields="IMAGETYP"
              label="IMAGETYP"
              placeholder=""
              options={["object", "dark", "zero", "flat", "arc"].map((v) => ({
                label: v,
                value: v,
              }))}
            />

            <div className="relative col-span-full flex h-12 items-center justify-center">
              <Separator orientation="horizontal" className="absolute top-1/2" />
              <form.Subscribe
                selector={(formState) => [
                  formState.fieldMeta.OBJECT?.isValid &&
                    formState.fieldMeta["DATE-OBS.value"]?.isValid &&
                    formState.fieldMeta["UT.value"]?.isValid,
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

            <TextFieldWithKnown
              form={form}
              fields="MAIN-ID"
              label="MAIN-ID"
              placeholder="Simbad main ID object name"
            />
            <TextFieldWithKnown
              form={form}
              fields="SPTYPE"
              label="SPTYPE"
              placeholder="Simbad spectral type"
            />
            <TextFieldWithKnown
              form={form}
              fields="AIRMASS"
              label="AIRMASS"
              placeholder="Airmass"
            />

            <TextFieldWithKnown
              form={form}
              fields="TIME-OBS"
              label="TIME-OBS"
              placeholder="Local time at the start of the observation"
            />
            <TextFieldWithKnown
              form={form}
              fields="ST"
              label="ST"
              placeholder="Local mean sidereal time"
            />
            <TextFieldWithKnown form={form} fields="HA" label="HA" placeholder="Hour angle" />

            <TextFieldWithKnown form={form} fields="RA" label="RA" placeholder="Right ascension" />
            <TextFieldWithKnown form={form} fields="DEC" label="DEC" placeholder="Declination" />
            <TextFieldWithKnown
              form={form}
              fields="EQUINOX"
              label="EQUINOX"
              placeholder="Epoch of RA y DEC"
            />

            <TextFieldWithKnown
              form={form}
              fields="RA2000"
              label="RA2000"
              placeholder="Right ascension ICRS J2000"
            />
            <TextFieldWithKnown
              form={form}
              fields="DEC2000"
              label="DEC2000"
              placeholder="Declination ICRS J2000"
            />
            <TextFieldWithKnown form={form} fields="JD" label="JD" placeholder="Julian date" />

            <TextFieldWithKnown
              form={form}
              fields="RA1950"
              label="RA1950"
              placeholder="Right ascension FK4"
            />
            <TextFieldWithKnown
              form={form}
              fields="DEC1950"
              label="DEC1950"
              placeholder="Declination FK4"
            />
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
