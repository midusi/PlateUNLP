import clsx from "clsx"
import { useId } from "react"
import { Input } from "~/components/atoms/input"
import { Label } from "~/components/atoms/label"
import { ReferenceLampRange } from "~/components/molecules/ReferenceLampRange"
import { useGlobalStore } from "~/hooks/use-global-store"

export function ReferenceLampRangeUI() {
  return (
    <div className="flex w-full overflow-hidden justify-center">
      <div className="flex-8" style={{ width: `90%` }}>
        <ReferenceLampRange />
      </div>
      <div className="m-4 flex-2 w-[200px]">
        <div className="pb-1">
          <MinInput />
        </div>
        <div className="">
          <MaxInput />
        </div>
      </div>
    </div>
  )
}

function MinInput() {
  const inputId = useId()
  const [rangeMin, setRangeMin, rangeMax] = useGlobalStore((s) => [
    s.rangeMin,
    s.setRangeMin,
    s.rangeMax,
  ])

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        Min. wavelength
      </Label>
      <div className="flex items-center gap-1">
        <Input
          id={inputId}
          type="number"
          value={rangeMin}
          onChange={(e) => {
            const value = Number(e.target.value)
            if (value < rangeMax) setRangeMin(value)
          }}
          className={clsx(
            "h-6 text-sm px-2 tabular-nums",
            "disabled:opacity-100 disabled:cursor-default",
          )}
        />
        <span className="text-gray-500">Å</span>
      </div>
    </div>
  )
}

function MaxInput() {
  const inputId = useId()
  const [rangeMax, setRangeMax, rangeMin] = useGlobalStore((s) => [
    s.rangeMax,
    s.setRangeMax,
    s.rangeMin,
  ])

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        Max. wavelength
      </Label>
      <div className="flex items-center gap-1">
        <Input
          id={inputId}
          type="number"
          value={rangeMax}
          className={clsx(
            "h-6 text-sm px-2 tabular-nums",
            "disabled:opacity-100 disabled:cursor-default",
          )}
          onChange={(e) => {
            const value = Number(e.target.value)
            if (value > rangeMin) setRangeMax(value)
          }}
        />
        <span className="text-gray-500">Å</span>
      </div>
    </div>
  )
}
