import { useStore } from "@tanstack/react-form"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import type { Input } from "~/components/ui/input"
import { useFieldContext } from "~/hooks/use-app-form-context"

type RangeFieldProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
  onOk?: () => void
  min: number
  max: number
  step: number
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

export function RangeField({
  className,
  label,
  description,
  disabled,
  onOk,
  min,
  max,
  step,
  ...props
}: RangeFieldProps) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field className={className}>
      <label className="flex flex-row gap-2">
        {label && <FieldLabel>{`${label}: ${field.state.value.toString()}`}</FieldLabel>}
        <input
          {...props}
          type="range"
          min={min}
          max={max}
          step={step}
          value={field.state.value}
          disabled={disabled}
          onChange={(e) => {
            field.handleChange(Number(e.target.value))
          }}
          onMouseUp={() => {
            field.handleChange(field.state.value)
          }}
          onTouchEnd={() => {
            field.handleChange(field.state.value)
          }}
          onBlur={field.handleBlur}
        />
      </label>
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
