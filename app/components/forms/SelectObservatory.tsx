import { Combobox } from "@base-ui-components/react/combobox"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { matchSorter } from "match-sorter"
import { useMemo, useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { db } from "~/db"
import { cn } from "~/lib/utils"

const getObservatories = createServerFn().handler(async () => {
  const observatories = await db.query.observatory.findMany({
    columns: { id: true, name: true, aliases: true },
    orderBy: (t, { asc }) => asc(t.name),
  })
  return observatories
})

export const getObservatoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["select-observatory-list"],
    queryFn: () => getObservatories(),
  })

type Observatory = Awaited<ReturnType<typeof getObservatories>>[number]

/**
 * Select an observatory from the list of available observatories (from the database).
 * It uses a popover with a command input to search and select an observatory.
 * @param value - The currently selected observatory ID.
 * @param setValue - Function to set the selected observatory ID.
 */
export function SelectObservatory({
  id,
  value,
  setValue,
}: {
  id?: string
  value: string
  setValue: (value: string) => void
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const { data: observatories } = useQuery({
    ...getObservatoriesQueryOptions(),
    initialData: [],
  })
  const selectedValue = useMemo(
    () => observatories.find((o) => o.id === value) || null,
    [value, observatories],
  )

  const filteredItems = useMemo(() => {
    const query = searchValue.trim()
    if (!query) return observatories

    const results = matchSorter(observatories, query, {
      keys: [
        { key: "id", threshold: matchSorter.rankings.STARTS_WITH },
        { key: "name", threshold: matchSorter.rankings.CONTAINS },
        { key: "aliases", threshold: matchSorter.rankings.CONTAINS },
      ],
    })
    return results
  }, [searchValue, observatories])

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      onOpenChangeComplete={(open) => {
        if (!open) setSearchValue("")
      }}
    >
      <PopoverTrigger
        id={id}
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            className="my-0.5 w-full min-w-0 justify-between bg-transparent font-normal"
          />
        }
      >
        <span className="truncate">
          {selectedValue ? selectedValue.name : "Search observatory..."}
        </span>
        <span className="icon-[ph--caret-up-down-bold] ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        collisionAvoidance={{ fallbackAxisSide: "none" }}
        className="w-(--anchor-width) p-0"
      >
        <Combobox.Root
          items={filteredItems}
          selectionMode="single"
          selectedValue={selectedValue}
          onSelectedValueChange={(nextValue) => {
            setValue(nextValue.id)
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
            {(observatory: Observatory) => (
              <Combobox.Item
                key={observatory.id}
                value={observatory}
                className={cn(
                  "relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1 text-sm outline-hidden",
                  "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                  "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                )}
              >
                <span className="grow">{observatory.name}</span>
                <Combobox.ItemIndicator>
                  <span className="icon-[ph--check-circle-fill] pointer-events-none size-5 shrink-0 text-primary" />
                </Combobox.ItemIndicator>
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Root>
      </PopoverContent>
    </Popover>
  )
}
