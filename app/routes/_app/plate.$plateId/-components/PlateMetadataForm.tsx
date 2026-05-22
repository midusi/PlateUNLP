import { Collapsible } from "@base-ui/react/collapsible"
import { useRouter } from "@tanstack/react-router"
import type { z } from "zod"
import { SelectObservatory } from "~/components/forms/SelectObservatory"
import { TextFieldWithKnown } from "~/components/forms/text-field-with-known"
import { TextAreaFieldWithKnown } from "~/components/forms/textarea-field-with-known"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "~/components/ui/field"
import { Progress } from "~/components/ui/progress"
import { Separator } from "~/components/ui/separator"
import { useAppForm } from "~/hooks/use-app-form"
import { notifyError } from "~/lib/notifications"
import { cn } from "~/lib/utils"
import { getPlateMetadataCompletion, PlateMetadataSchema } from "~/types/spectrum-metadata"
import { updatePlateMetadata } from "../-actions/update-plate-metadata"

export function PlateMetadataForm({
  plateId,
  defaultValues,
}: {
  plateId: string
  defaultValues: z.input<typeof PlateMetadataSchema>
}) {
  const router = useRouter()

  const form = useAppForm({
    defaultValues: defaultValues,
    validators: { onChange: PlateMetadataSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await updatePlateMetadata({ data: { plateId, metadata: value } })
        if (value["PLATE-N"] !== defaultValues["PLATE-N"]) {
          // If the plate number has changed, we need to update the route title
          router.invalidate()
        }
        formApi.reset(value)
      } catch (error) {
        notifyError("Failed to update plate metadata", error)
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

  return (
    <Collapsible.Root defaultOpen={true}>
      <Card className="gap-0">
        <CardHeader className="flex items-center gap-4">
          <CardTitle className="grow">Plate metadata</CardTitle>
          <form.Subscribe selector={(state) => getPlateMetadataCompletion(state.values)}>
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
            <span className="icon-[ph--caret-left-bold] size-5 transition-all ease-out group-data-[panel-open]:-rotate-90" />
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
            <form.Field name="OBSERVAT">
              {(field) => (
                <Field name={field.name}>
                  <FieldLabel>OBSERVAT</FieldLabel>
                  <FieldControl
                    render={
                      <SelectObservatory value={field.state.value} setValue={field.handleChange} />
                    }
                  />
                  <FieldDescription>Observatory where the plate was captured.</FieldDescription>
                  {field.state.meta.errors[0] && (
                    <FieldError>{field.state.meta.errors[0].message}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>
            <form.AppField name="PLATE-N">
              {(field) => (
                <field.TextField
                  label="PLATE-N"
                  placeholder="e.g. 317"
                  description="Plate identifier in the original observation catalogue."
                />
              )}
            </form.AppField>
            <TextFieldWithKnown
              form={form}
              fields="TELESCOPE"
              label="TELESCOPE"
              placeholder="e.g. Zeiss Triplet 15 cm"
              description="Telescope used to capture the plate."
            />

            <TextFieldWithKnown
              form={form}
              fields="INSTRUME"
              label="INSTRUME"
              placeholder="e.g. Objective prism spectrograph"
              description="Instrument used during the observation, for example a spectrograph."
            />
            <TextFieldWithKnown
              form={form}
              fields="DETECTOR"
              label="DETECTOR"
              placeholder="e.g. Photographic plate"
              description="Detector that recorded the observation."
            />
            <TextFieldWithKnown
              form={form}
              fields="OBSERVER"
              label="OBSERVER"
              placeholder="e.g. W. Muench"
              description="Person who made the observation."
            />
            <TextAreaFieldWithKnown
              form={form}
              fields="OBSNOTES"
              label="OBSNOTES"
              placeholder="e.g. bad guiding"
              description="Observer notes about the acquisition conditions."
              rows={3}
              className="col-span-full"
            />

            <Separator orientation="horizontal" className="col-span-full" />

            <TextFieldWithKnown
              form={form}
              fields="SCANNER"
              label="SCANNER"
              placeholder="e.g. Epson Expression 10000XL"
              description="Technical specification or model of the scanner used."
            />
            <TextFieldWithKnown
              form={form}
              fields="SCANRES"
              label="SCANRES"
              placeholder="e.g. 2400"
              description="Scan resolution in dpi. PIXSIZE is derived automatically from this value."
            />
            <TextFieldWithKnown
              form={form}
              fields="SCANGAIN"
              label="SCANGAIN"
              placeholder="e.g. 1.0"
              description="Scanner gain in electrons per ADU, if known."
            />
            <TextFieldWithKnown
              form={form}
              fields="SCANSOFT"
              label="SCANSOFT"
              placeholder="e.g. VueScan"
              description="Software used to digitize the plate."
            />
            <TextFieldWithKnown
              form={form}
              fields="DATESCAN"
              label="DATESCAN"
              placeholder="e.g. 2011-05-17T10:33:26"
              type="datetime-local"
              step="1"
              description="Scan date and time in local datetime format."
            />
            <TextFieldWithKnown
              form={form}
              fields="SCANAUTH"
              label="SCANAUTH"
              placeholder="e.g. K. Tsvetkova"
              description="Person who digitized the plate."
            />
            <TextAreaFieldWithKnown
              form={form}
              fields="SCANNOTE"
              label="SCANNOTE"
              placeholder="e.g. rescanned at higher resolution after dust removal"
              description="Notes about the scanning process itself."
              rows={3}
              className="col-span-full"
            />

            <Separator orientation="horizontal" className="col-span-full" />

            <TextAreaFieldWithKnown
              form={form}
              fields="PLATNOTE"
              label="PLATNOTE"
              placeholder="e.g. SA 87 = Kapteyn Selected Area 87"
              description="Plate notes (about the plate itself, such as archival or provenance)."
              rows={4}
              className="col-span-full"
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
