import { useStore } from "@tanstack/react-form"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { NumberStepper } from "~/components/ui/number-stepper"
import { useFieldContext } from "~/hooks/use-app-form-context"
import { cn } from "~/lib/utils"

type StepperFieldProps = {
  className?: string
  label: string
  description?: React.ReactNode
  disabled?: boolean
  min: number
  max: number
  step: number
}

/** Campo numerico entero o decimal con botones y teclado para subir y bajar el valor. */
export function StepperField({
  className,
  label,
  description,
  disabled,
  min,
  max,
  step,
}: StepperFieldProps) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field className={cn("min-w-0", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <FieldLabel className="shrink-0">{label}</FieldLabel>
        <NumberStepper
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={field.state.value}
          disabled={disabled}
          onValueChange={(value) => field.handleChange(value)}
          onValueCommitted={() => field.handleBlur()}
        />
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
