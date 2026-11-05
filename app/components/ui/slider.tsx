import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "~/lib/utils"

type SliderProps = Omit<SliderPrimitive.Root.Props<number>, "value" | "defaultValue"> & {
  value: number
  /** Etiqueta accesible del control deslizante. */
  "aria-label": string
}

function Slider({ className, value, "aria-label": ariaLabel, ...props }: SliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      value={value}
      className={cn("flex w-full min-w-0 items-center", className)}
      {...props}
    >
      <SliderPrimitive.Control className="flex h-5 w-full touch-pan-y select-none items-center">
        <SliderPrimitive.Track className="h-1.5 w-full select-none rounded-full bg-olive-200">
          <SliderPrimitive.Indicator className="rounded-full bg-olive-950" />
          <SliderPrimitive.Thumb
            getAriaLabel={() => ariaLabel}
            className="size-4 select-none rounded-full border border-olive-950 bg-white shadow-xs outline-none transition-[box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[disabled]:opacity-50"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
