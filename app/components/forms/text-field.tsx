import { useStore } from "@tanstack/react-form"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useFieldContext } from "~/hooks/use-app-form-context"

type TextFieldProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
  type?: string
  hight_modifier?: string
  disabled?: boolean
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

export function TextField({
  className,
  label,
  description,
  type,
  hight_modifier,
  disabled,
  ...props
}: TextFieldProps) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Input
        {...props}
        className={`disabled:bg-gray-200 ${hight_modifier}`}
        type={type}
        name={field.name}
        value={field.state.value}
        disabled={disabled}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
