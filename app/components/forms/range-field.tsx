import { useStore } from "@tanstack/react-form"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Slider } from "~/components/ui/slider"
import { useFieldContext } from "~/hooks/use-app-form-context"
import { cn } from "~/lib/utils"

type RangeFieldProps = {
  className?: string
  label: string
  description?: React.ReactNode
  disabled?: boolean
  min: number
  max: number
  step: number
}

/** Valor sin ruido de punto flotante (0.30000000000000004 -> 0.3), pero sin redondear a `step`. */
function formatValue(value: number): string {
  return Number(value.toFixed(4)).toString()
}

export function RangeField({
  className,
  label,
  description,
  disabled,
  min,
  max,
  step,
}: RangeFieldProps) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <FieldLabel className="shrink-0">{label}</FieldLabel>
        <Slider
          aria-label={label}
          className="min-w-12 flex-1"
          min={min}
          max={max}
          step={step}
          value={field.state.value}
          disabled={disabled}
          onValueChange={(value) => field.handleChange(value)}
          onValueCommitted={() => field.handleBlur()}
        />
        <span className="w-10 shrink-0 text-right font-medium text-sm tabular-nums">
          {formatValue(field.state.value)}
        </span>
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
