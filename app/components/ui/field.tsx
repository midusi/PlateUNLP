import { Field as FieldPrimitive } from "@base-ui/react/field"
import { cn } from "~/lib/utils"

function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root data-slot="field" className={cn("grid gap-2", className)} {...props} />
  )
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(
        "flex select-none items-center gap-2 font-medium text-sm leading-none data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[invalid]:text-destructive data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

function FieldControl(props: FieldPrimitive.Control.Props) {
  return <FieldPrimitive.Control data-slot="field-control" {...props} />
}

function FieldDescription({ className, ...props }: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function FieldError({ className, match, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn("text-destructive text-sm", className)}
      match={match ?? true}
      {...props}
    />
  )
}

export { Field, FieldLabel, FieldControl, FieldDescription, FieldError }
