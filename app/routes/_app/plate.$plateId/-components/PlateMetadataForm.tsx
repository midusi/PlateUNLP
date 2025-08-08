import { Collapsible } from "@base-ui-components/react/collapsible"
import { useRouter } from "@tanstack/react-router"
import type { z } from "zod"
import { SelectObservatory } from "~/components/forms/SelectObservatory"
import { TextFieldWithKnown } from "~/components/forms/text-field-with-known"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Field, FieldControl, FieldError, FieldLabel } from "~/components/ui/field"
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
            <form.Field name="OBSERVAT">
              {(field) => (
                <Field name={field.name}>
                  <FieldLabel>OBSERVAT</FieldLabel>
                  <FieldControl
                    render={
                      <SelectObservatory value={field.state.value} setValue={field.handleChange} />
                    }
                  />
                  {field.state.meta.errors[0] && (
                    <FieldError>{field.state.meta.errors[0].message}</FieldError>
                  )}
                </Field>
              )}
            </form.Field>
            <form.AppField name="PLATE-N">
              {(field) => <field.TextField label="PLATE-N" placeholder="Identification number" />}
            </form.AppField>
            <TextFieldWithKnown
              form={form}
              fields="OBSERVER"
              label="OBSERVER"
              placeholder="OBSERVER"
            />

            <TextFieldWithKnown
              form={form}
              fields="DIGITALI"
              label="DIGITALI"
              placeholder="DIGITALI"
            />
            <TextFieldWithKnown
              form={form}
              fields="SCANNER"
              label="SCANNER"
              placeholder="SCANNER"
            />
            <TextFieldWithKnown
              form={form}
              fields="SOFTWARE"
              label="SOFTWARE"
              placeholder="SOFTWARE"
            />

            <TextFieldWithKnown
              form={form}
              fields="TELESCOPE"
              label="TELESCOPE"
              placeholder="TELESCOPE"
            />
            <TextFieldWithKnown
              form={form}
              fields="DETECTOR"
              label="DETECTOR"
              placeholder="DETECTOR"
            />
            <TextFieldWithKnown
              form={form}
              fields="INSTRUMENT"
              label="INSTRUMENT"
              placeholder="INSTRUMENT"
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
