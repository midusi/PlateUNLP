import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "~/lib/utils"

function Checkbox({ className, indeterminate, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      indeterminate={indeterminate}
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-olive-300 shadow-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[checked]:border-olive-950 data-[checked]:bg-olive-950 data-[checked]:text-white",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none data-[unchecked]:hidden"
      >
        <span
          className={cn(
            "size-3.5",
            indeterminate ? "icon-[ph--minus-bold]" : "icon-[ph--check-bold]",
          )}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
