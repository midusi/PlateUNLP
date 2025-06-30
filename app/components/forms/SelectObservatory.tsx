import { queryOptions, useQuery } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { db } from "~/db"
import { cn } from "~/lib/utils"

const getObservatories = createServerFn().handler(async () => {
  const observatories = await db.query.observatory.findMany({
    columns: { id: true, name: true, aliases: true },
    orderBy: (t, { asc }) => asc(t.id),
  })
  return observatories
})

export const getObservatoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["select-observatory-list"],
    queryFn: () => getObservatories(),
  })

function formatObservatory(observatory?: { id: string; name: string }) {
  return observatory ? `[${observatory.id}] ${observatory.name}` : "Unknown..."
}

/**
 * Select an observatory from the list of available observatories (from the database).
 * It uses a popover with a command input to search and select an observatory.
 * @param value - The currently selected observatory ID.
 * @param setValue - Function to set the selected observatory ID.
 */
export function SelectObservatory({
  value,
  setValue,
}: {
  value: string
  setValue: (value: string) => void
}) {
  const { data: observatories } = useQuery({
    ...getObservatoriesQueryOptions(),
    initialData: [],
  })

  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-ful my-0.5 justify-between font-normal"
        >
          <span className="truncate">
            {value
              ? formatObservatory(observatories.find((o) => o.id === value))
              : "Search observatory..."}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search observatory..." />
          <CommandList>
            <CommandEmpty>No observatory found.</CommandEmpty>
            <CommandGroup>
              {observatories.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.id}
                  onSelect={(currentValue) => {
                    setValue(currentValue)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 h-4 w-4", value === o.id ? "opacity-100" : "opacity-0")}
                  />
                  {formatObservatory(o)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
