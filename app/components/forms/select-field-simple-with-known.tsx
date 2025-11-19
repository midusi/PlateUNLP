import { useStore } from "@tanstack/react-form"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError } from "~/components/ui/field"
import type { Input } from "~/components/ui/input"
import { withFieldGroup } from "~/hooks/use-app-form"

type SelectFieldSimpleWithKnownProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
  options: OptionFormat[]
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

type Fields = {
  value: string
  isKnown: boolean
}

type ValueType = string
type OptionFormat = {
  label: string
  value: ValueType
}

export const SelectFieldSimpleWithKnown = withFieldGroup<
  Fields,
  unknown,
  SelectFieldSimpleWithKnownProps
>({
  render: function Render({ group, className, label, description, placeholder, options }) {
    const isKnown = useStore(group.store, (state) => state.values.isKnown)

    return (
      <Field className={className}>
        <group.AppField name="value">
          {(field) => (
            <>
              <field.SelectFieldSimple
                label={label}
                options={options}
                disabled={!isKnown}
                placeholder={isKnown ? placeholder : "Unknown"}
                hideComments={true}
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
