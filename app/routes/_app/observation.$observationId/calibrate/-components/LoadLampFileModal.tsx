import { ConsoleLogWriter } from "drizzle-orm"
import type z from "zod"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { Field, FieldControl, FieldError, FieldLabel } from "~/components/ui/field"
import { useAppForm } from "~/hooks/use-app-form"
import { authClient } from "~/lib/auth-client"
import { notifyError, notifySucces } from "~/lib/notifications"
import { createLoadLampFormSchema } from "~/types/load-lamp-form-schema"
import { addMaterial } from "../-actions/add-material"
import { parseLampFile } from "../-utils/parse-lamp-file"

interface LoadLampFileModalProps {
  onSucces: (newMaterial: string) => void
  onClose: () => void
  actualLampsNamesList: string[]
}

export function LoadLampFileModal({
  onClose,
  onSucces,
  actualLampsNamesList,
}: LoadLampFileModalProps) {
  const LoadLampFormSchema = createLoadLampFormSchema(actualLampsNamesList)
  const form = useAppForm({
    defaultValues: {
      name: "",
      file: new File([], ""),
    },
    validators: { onChange: LoadLampFormSchema, onMount: LoadLampFormSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const { name, file } = value

        const arr = await parseLampFile(file)

        const material = await addMaterial({ data: { name: name, arr: arr } })

        notifySucces("Lamp file loaded")
        onSucces(material.name) // cerrar modal
      } catch (error) {
        notifyError("Failed to load new lamp file", error)
      }
    },
    // listeners: {
    //   onChange: async ({ formApi }) => {
    //     if (formApi.state.isValid) {

    //     }
    //   },
    //   onChangeDebounceMs: 500,
    // },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-[400px] p-4">
        <CardHeader>
          <h2 className="text-xl">Upload Lamp File</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
          <form.Field name="file">
            {(field) => (
              <Field name={field.name}>
                <FieldLabel>Lamp file</FieldLabel>
                <input
                  type="file"
                  accept=".dat" // opcional: filtrar tipos de archivo
                  onChange={(e) => {
                    const files = e.target.files
                    if (files && files.length > 0) {
                      field.handleChange(files[0]) // solo tomo el primer archivo
                    } else {
                      /** Dejar que Zod marque error */
                      field.handleChange(undefined as unknown as File)
                    }
                  }}
                  className="w-full rounded-none border border-gray-300 p-1"
                />

                {field.state.meta.errors[0] && (
                  <FieldError>{field.state.meta.errors[0].message}</FieldError>
                )}
              </Field>
            )}
          </form.Field>
        </CardContent>
        <CardFooter className="flex justify-between">
          <form.Subscribe
            selector={(formState) => [formState.isValid, formState.isSubmitting, formState.isDirty]}
          >
            {([isValid, isSubmitting, isDirty]) => (
              <>
                <Button onClick={onClose} variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={form.handleSubmit} disabled={!isValid}>
                  {isSubmitting ? (
                    <span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              </>
            )}
          </form.Subscribe>
        </CardFooter>
      </Card>
    </div>
  )
}
