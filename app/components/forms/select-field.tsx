import { Combobox } from "@base-ui-components/react/combobox"
import { useStore } from "@tanstack/react-form"
import { matchSorter } from "match-sorter"
import { useMemo, useState } from "react"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { useFieldContext } from "~/hooks/use-app-form-context"
import { cn } from "~/lib/utils"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

type SelectFieldProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
  options: OptionFormat[]
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

type ValueType = string
type OptionFormat = {
  name: string
  value: ValueType
}
export function SelectField({ className, label, description, options }: SelectFieldProps) {
  const field = useFieldContext<ValueType>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const selectedValue = useMemo(
    () => options.find((o) => o.value === field.state.value) || null,
    [options, field.state.value],
  )

  const filteredItems = useMemo(() => {
    const query = searchValue.trim()
    if (!query) return options

    const results = matchSorter(options, query, {
      keys: [{ key: "name", threshold: matchSorter.rankings.CONTAINS }],
    })
    return results
  }, [searchValue, options])
  return (
    <Field className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Popover
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        onOpenChangeComplete={(open) => {
          if (!open) setSearchValue("")
        }}
      >
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={popoverOpen}
              className="my-0.5 w-full min-w-0 justify-between bg-transparent font-normal"
            />
          }
        >
          <span className="truncate">{selectedValue ? selectedValue.name : "Search..."}</span>
          <span className="icon-[ph--caret-up-down-bold] ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          collisionAvoidance={{ fallbackAxisSide: "none" }}
          className="w-(--anchor-width) p-0"
        >
          <Combobox.Root
            items={filteredItems}
            value={selectedValue}
            onValueChange={(nextValue) => {
              if (!nextValue) return
              field.handleChange(nextValue.value)
              setPopoverOpen(false)
            }}
            inputValue={searchValue}
            onInputValueChange={setSearchValue}
          >
            <div className="p-2">
              <Combobox.Input render={<Input placeholder="e.g. La Plata" />} />
            </div>
            <Combobox.Empty>
              <p className="px-2 py-4 text-center text-muted-foreground text-sm">
                No obervatories found.
              </p>
            </Combobox.Empty>
            <Combobox.List className="scrollbar-border max-h-[300px] scroll-py-2 overflow-y-auto overscroll-contain px-2 pb-2 empty:p-0">
              {(option: OptionFormat) => (
                <Combobox.Item
                  key={option.name}
                  value={option}
                  className={cn(
                    "relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1 text-sm outline-hidden",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                  )}
                >
                  <span className="grow">{option.name}</span>
                  <Combobox.ItemIndicator>
                    <span className="icon-[ph--check-circle-fill] pointer-events-none size-5 shrink-0 text-primary" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Root>
        </PopoverContent>
      </Popover>
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
