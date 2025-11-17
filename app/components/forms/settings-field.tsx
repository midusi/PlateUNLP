import { useStore } from "@tanstack/react-form"
import { Pencil, PencilOff } from "lucide-react"
import { useState } from "react"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useFieldContext } from "~/hooks/use-app-form-context"

type SettingsFieldProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

export function SettingsField({ className, label, description, ...props }: SettingsFieldProps) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)
  const [editable, setEditable] = useState<boolean>(false)

  return (
    <Field className={className}>
      <div className="flex items-center justify-between">
        {label && <FieldLabel>{label}</FieldLabel>}
        <button
          type="button"
          onClick={() => setEditable((prev) => !prev)}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          {editable ? (
            <PencilOff size={16} className="text-red-500" />
          ) : (
            <Pencil size={16} className="text-muted-foreground" />
          )}
        </button>
      </div>
      <Input
        {...props}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        disabled={!editable}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
