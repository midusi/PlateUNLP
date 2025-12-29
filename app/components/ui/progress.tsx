import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "~/lib/utils"

function Progress({ className, children, ...props }: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root data-slot="progress" className="relative" {...props}>
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className={cn("block h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="block h-full w-full bg-primary transition-all"
        />
      </ProgressPrimitive.Track>
      {children}
    </ProgressPrimitive.Root>
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      className={cn("mt-2 flex justify-end font-medium text-foreground text-sm", className)}
      {...props}
    />
  )
}

export { Progress, ProgressValue }
