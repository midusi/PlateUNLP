import { useStore } from "@tanstack/react-form"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { inputClassname } from "~/components/ui/input"
import { withFieldGroup } from "~/hooks/use-app-form"
import { cn } from "~/lib/utils"

type TextAreaFieldWithKnownProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
} & Pick<React.ComponentProps<"textarea">, "placeholder" | "rows">

type Fields = {
  value: string
  isKnown: boolean
}

export const TextAreaFieldWithKnown = withFieldGroup<Fields, unknown, TextAreaFieldWithKnownProps>({
  render: function Render({ group, className, label, description, placeholder, rows = 4 }) {
    const isKnown = useStore(group.store, (state) => state.values.isKnown)

    return (
      <Field className={className}>
        <group.AppField name="value">
          {(field) => (
            <>
              {label && <FieldLabel>{label}</FieldLabel>}
              <textarea
                name={field.name}
                value={isKnown ? field.state.value : ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={!isKnown}
                placeholder={isKnown ? placeholder : "Unknown"}
                rows={rows}
                className={cn(
                  inputClassname,
                  "min-h-24 py-2",
                  !isKnown && "placeholder:font-medium placeholder:italic",
                )}
              />
              <div className="flex items-start justify-between gap-2">
                {description ? <FieldDescription>{description}</FieldDescription> : <span />}
                <group.AppField name="isKnown">
                  {(field) => (
                    <Button
                      className="ml-auto h-min px-1 py-0 font-normal text-muted-foreground text-xs italic underline"
                      variant="ghost"
                      onClick={() => field.handleChange((prev) => !prev)}
                    >
                      {field.state.value ? "unknown?" : "known!"}
                    </Button>
                  )}
                </group.AppField>
              </div>

              {field.state.meta.errors.length > 0 && (
                // @ts-expect-error https://github.com/TanStack/form/issues/1652
                <FieldError>{field.state.meta.errors[0]!.message}</FieldError>
              )}
            </>
          )}
        </group.AppField>
      </Field>
    )
  },
})
