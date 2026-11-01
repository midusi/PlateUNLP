import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { cn } from "~/lib/utils"

type NumberStepperProps = Omit<
  NumberFieldPrimitive.Root.Props,
  "value" | "defaultValue" | "onValueChange"
> & {
  value: number
  /** Se llama solo con valores numericos: vaciar el campo no cambia el valor. */
  onValueChange: (value: number) => void
  /** Etiqueta accesible del campo. */
  "aria-label": string
}

const buttonClassName =
  "grid w-7 shrink-0 select-none place-items-center text-olive-950 outline-none transition-colors enabled:cursor-pointer enabled:hover:bg-olive-200 enabled:hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-30"

/**
 * Campo numerico compacto con botones de subir y bajar (`−  3  +`). Con el
 * foco, las flechas arriba/abajo suben y bajan el valor y tambien se puede
 * escribir.
 */
function NumberStepper({
  className,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  ...props
}: NumberStepperProps) {
  return (
    <NumberFieldPrimitive.Root
      data-slot="number-stepper"
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next)
      }}
      className={cn("flex", className)}
      {...props}
    >
      <NumberFieldPrimitive.Group className="flex h-8 items-stretch overflow-hidden rounded-sm border border-olive-300 bg-olive-100 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <NumberFieldPrimitive.Decrement
          aria-label={`Decrease ${ariaLabel}`}
          className={buttonClassName}
        >
          <span className="icon-[ph--minus-bold] size-3.5" />
        </NumberFieldPrimitive.Decrement>
        <NumberFieldPrimitive.Input
          aria-label={ariaLabel}
          className="w-9 min-w-0 bg-transparent text-center font-medium text-sm tabular-nums outline-none"
        />
        <NumberFieldPrimitive.Increment
          aria-label={`Increase ${ariaLabel}`}
          className={buttonClassName}
        >
          <span className="icon-[ph--plus-bold] size-3.5" />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}

export { NumberStepper }
