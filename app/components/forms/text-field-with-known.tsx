import { useStore } from "@tanstack/react-form"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { withFieldGroup } from "~/hooks/use-app-form"
import { cn } from "~/lib/utils"

type TextFieldWithKnownProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

type Fields = {
  value: string
  isKnown: boolean
}

export const TextFieldWithKnown = withFieldGroup<Fields, unknown, TextFieldWithKnownProps>({
  render: function Render({ group, className, label, description, placeholder, ...props }) {
    const isKnown = useStore(group.store, (state) => state.values.isKnown)

    return (
      <Field className={className}>
        <group.AppField name="value">
          {(field) => (
            <>
              {label && <FieldLabel>{label}</FieldLabel>}
              <Input
                {...props}
                name={field.name}
                value={isKnown ? field.state.value : ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={!isKnown}
                placeholder={isKnown ? placeholder : "Unknown"}
                className={cn(!isKnown && "placeholder:font-medium placeholder:italic")}
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
