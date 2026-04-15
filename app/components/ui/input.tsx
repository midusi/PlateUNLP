import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "~/lib/utils"

const inputClassname = cn(
  "flex h-9 w-full min-w-0 rounded-sm border border-olive-300 bg-olive-100 px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-olive-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
)

function Input({ className, ...props }: InputPrimitive.Props) {
  return <InputPrimitive data-slot="input" className={cn(inputClassname, className)} {...props} />
}

export { Input, inputClassname }
