import { Autocomplete } from "@base-ui/react/autocomplete"
import { useStore } from "@tanstack/react-form"
import { Button } from "~/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { inputClassname } from "~/components/ui/input"
import { withFieldGroup } from "~/hooks/use-app-form"
import { cn } from "~/lib/utils"

type AutocompleteFieldWithKnownProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
  placeholder?: string
  /** Suggested values offered while typing. Free text is still allowed. */
  options: string[]
  /** Fired when the user commits a suggestion (picks an item from the list). */
  onSelect?: (value: string) => void
}

type Fields = {
  value: string
  isKnown: boolean
}

export const AutocompleteFieldWithKnown = withFieldGroup<
  Fields,
  unknown,
  AutocompleteFieldWithKnownProps
>({
  render: function Render({
    group,
    className,
    label,
    description,
    placeholder,
    options,
    onSelect,
  }) {
    const isKnown = useStore(group.store, (state) => state.values.isKnown)

    return (
      <Field className={className}>
        <group.AppField name="value">
          {(field) => (
            <>
              {label && <FieldLabel>{label}</FieldLabel>}
              <Autocomplete.Root
                items={options}
                value={isKnown ? field.state.value : ""}
                onValueChange={(value, details) => {
                  field.handleChange(value)
                  if (details.reason === "item-press") onSelect?.(value)
                }}
                disabled={!isKnown}
                openOnInputClick
                autoHighlight
              >
                <Autocomplete.Input
                  name={field.name}
                  onBlur={field.handleBlur}
                  disabled={!isKnown}
                  placeholder={isKnown ? placeholder : "Unknown"}
                  className={cn(
                    inputClassname,
                    !isKnown && "placeholder:font-medium placeholder:italic",
                  )}
                />
                <Autocomplete.Portal>
                  <Autocomplete.Positioner sideOffset={6} className="z-50 outline-none">
                    <Autocomplete.Popup
                      className={cn(
                        "max-h-72 w-(--anchor-width) overflow-y-auto rounded-md border border-olive-300 bg-stone-50 py-1",
                        "shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]",
                        "origin-(--transform-origin) transition-[transform,opacity]",
                        "data-ending-style:scale-95 data-ending-style:opacity-0",
                        "data-starting-style:scale-95 data-starting-style:opacity-0",
                      )}
                    >
                      <Autocomplete.Empty className="px-3 py-2 text-center text-olive-500 text-sm empty:hidden">
                        No matches.
                      </Autocomplete.Empty>
                      <Autocomplete.List>
                        {(item: string) => (
                          <Autocomplete.Item
                            key={item}
                            value={item}
                            className={cn(
                              "cursor-pointer select-none px-3 py-1.5 text-olive-950 text-sm outline-none",
                              "data-highlighted:bg-olive-100 data-highlighted:text-orange-600",
                            )}
                          >
                            {item}
                          </Autocomplete.Item>
                        )}
                      </Autocomplete.List>
                    </Autocomplete.Popup>
                  </Autocomplete.Positioner>
                </Autocomplete.Portal>
              </Autocomplete.Root>

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
