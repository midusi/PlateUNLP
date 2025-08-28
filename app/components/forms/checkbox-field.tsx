import { useStore } from "@tanstack/react-form"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import type { Input } from "~/components/ui/input"
import { useFieldContext } from "~/hooks/use-app-form-context"

type CheckboxFieldProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
  type?: string
  hight_modifier?: string
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

export function CheckboxField({ className, label, description, ...props }: CheckboxFieldProps) {
  const field = useFieldContext<boolean>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field className={className}>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          {...props}
          type="checkbox"
          name={field.name}
          checked={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.checked)}
        />
        {label && <FieldLabel>{label}</FieldLabel>}
      </label>
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
