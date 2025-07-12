import { useRouter } from "@tanstack/react-router"
import type { z } from "zod"
import { SelectObservatory } from "~/components/forms/SelectObservatory"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter } from "~/components/ui/card"
import { Label } from "~/components/ui/label"
import { useAppForm } from "~/hooks/use-app-form"
import { notifyError } from "~/lib/notifications"
import { PlateMetadataSchema } from "~/types/spectrum-metadata"
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
    defaultValues,
    validators: { onChange: PlateMetadataSchema },
    onSubmit: async ({ value }) => {
      try {
        await updatePlateMetadata({ data: { plateId, metadata: value } })
        if (value["PLATE-N"] !== defaultValues["PLATE-N"]) {
          // If the plate number has changed, we need to update the route title
          router.invalidate()
        }
      } catch (error) {
        notifyError("Failed to update plate metadata", error)
      }
    },
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
          <div className="grid grid-cols-3 content-normal justify-center gap-4">
            <form.Field name="OBSERVAT">
              {(field) => (
                <div>
                  <Label>OBSERVAT</Label>
                  <SelectObservatory value={field.state.value} setValue={field.handleChange} />
                  {field.state.meta.errors[0] && (
                    <p className="text-red-500">{field.state.meta.errors[0].message}</p>
                  )}
                </div>
              )}
            </form.Field>
            <form.AppField name="PLATE-N">
              {(field) => <field.TextField label="PLATE-N" placeholder="Identification number" />}
            </form.AppField>
            <form.AppField name="OBSERVER">
              {(field) => <field.TextField label="OBSERVER" placeholder="OBSERVER" />}
            </form.AppField>

            <form.AppField name="DIGITALI">
              {(field) => <field.TextField label="DIGITALI" placeholder="DIGITALI" />}
            </form.AppField>
            <form.AppField name="SCANNER">
              {(field) => <field.TextField label="SCANNER" placeholder="Scanner name" />}
            </form.AppField>
            <form.AppField name="SOFTWARE">
              {(field) => <field.TextField label="SOFTWARE" placeholder="Scan software" />}
            </form.AppField>

            <form.AppField name="TELESCOPE">
              {(field) => <field.TextField label="TELESCOPE" placeholder="Telescope name" />}
            </form.AppField>
            <form.AppField name="DETECTOR">
              {(field) => <field.TextField label="DETECTOR" placeholder="Detector" />}
            </form.AppField>
            <form.AppField name="INSTRUMENT">
              {(field) => <field.TextField label="INSTRUMENT" placeholder="Instrument" />}
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
