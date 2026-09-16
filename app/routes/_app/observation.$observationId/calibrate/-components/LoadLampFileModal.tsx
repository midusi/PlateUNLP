import { useRef, useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { Field, FieldError, FieldLabel } from "~/components/ui/field"
import { useAppForm } from "~/hooks/use-app-form"
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileFormatError, setFileFormatError] = useState<string | null>(null)

  const validateLampFile = async (file: File): Promise<boolean> => {
  try {
    const text = await file.text()
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    const dataLines =
      lines[0]?.toLowerCase().includes("intensity") &&
      lines[0]?.toLowerCase().includes("wavelength")
        ? lines.slice(1, 11)
        : lines.slice(0, 10)

    if (dataLines.length === 0) return false

    const lineRegex = /^\d+(\.\d+)?\s+\d+(\.\d+)?(\s+\S+)?$/
    return dataLines.every((line) => lineRegex.test(line))
  } catch {
    return false
  }
}

  const LoadLampFormSchema = createLoadLampFormSchema(actualLampsNamesList)
  const form = useAppForm({
    defaultValues: {
      name: "",
      file: new File([], ""),
    },
    validators: { onChange: LoadLampFormSchema, onMount: LoadLampFormSchema },
    onSubmit: async ({ value }) => {
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
      <Card className="w-100 p-4">
        <CardHeader>
          <h2 className="text-xl">
            <div className="flex items-center gap-2">
              <span>Upload Lamp File</span>
              <button
                type="button"
                title="Select a .dat file containing lamp data with the format: Wave Intensity [Material]"
                aria-label="Información sobre el formato del archivo"
                className="p-0.5 rounded hover:bg-gray-100"
              >
                <span className="icon-[ph--info] size-5 text-black!" style={{ color: "#000" }} />
              </button>
            </div>
          </h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
          <form.Field name="file">
            {(field) => (
              <Field name={field.name}>
                <FieldLabel>Lamp file</FieldLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dat" // opcional: filtrar tipos de archivo
                  onChange={async (e) => {
                    const files = e.target.files
                    if (files && files.length > 0) {
                      const f = files[0]
                      const ok = await validateLampFile(f)
                      if (ok) {
                        setFileFormatError(null)
                        field.handleChange(f) // archivo válido
                      } else {
                        setFileFormatError("File formato not valid. Expected: Wavelength Intensity [Material]")
                        field.handleChange(undefined as unknown as File) // resetear campo
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }

                    } else {
                      /** Dejar que Zod marque error */
                      setFileFormatError(null)
                      field.handleChange(undefined as unknown as File)
                    }
                  }}
                  className="w-full rounded-none border border-gray-300 p-1"
                />

                {fileFormatError && <FieldError>{fileFormatError}</FieldError>}
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
            {([isValid, isSubmitting, _isDirty]) => (
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
