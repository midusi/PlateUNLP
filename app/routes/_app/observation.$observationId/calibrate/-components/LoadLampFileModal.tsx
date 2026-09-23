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

  const validateLampFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    try {
      const text = await file.text()
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)

      const dataLines = /wavelength/i.test(lines[0] ?? "") ? lines.slice(1, 11) : lines.slice(0, 10)

      if (dataLines.length === 0) return { valid: false, error: "Invalid file format." }

      const lineRegex = /^\d+(\.\d+)?(\s+-?\d+(\.\d+)?)?\s+\S*[A-Za-z]\S*$/
      if (!dataLines.every((line) => lineRegex.test(line))) {
        return { valid: false, error: "Invalid file format." }
      }

      // Verificar valores negativos en Intensity
      const hasNegativeIntensity = dataLines.some((line) => {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 3) {
          const intensity = parseFloat(parts[1])
          return !isNaN(intensity) && intensity < 0
        }
        return false
      })

      if (hasNegativeIntensity) {
        return { valid: false, error: "Intensity field values must be non-negative." }
      }

      return { valid: true }
    } catch {
      return { valid: false, error: "Invalid file format." }
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
          <h2 className="text-xl">Upload Lamp File</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs">
            <p className="mb-1 text-gray-600">Expected .dat format (whitespace-separated):</p>
            <code className="block whitespace-pre font-mono">
              Wavelength Intensity Material{"\n"}3020.6391   182       FeI
            </code>
            <p className="mb- text-gray-600">Intensity field values must be non-negative</p>
          </div>
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
                       const result = await validateLampFile(f)
                        if (result.valid) {
                          setFileFormatError(null)
                          field.handleChange(f) // archivo válido
                        } else {
                          setFileFormatError(result.error ?? "Invalid file format.")
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
