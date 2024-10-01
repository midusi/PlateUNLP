import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGlobalStore } from "@/hooks/use-global-store"
import { LAMP_MATERIALS } from "@/lib/spectral-data"
import { useId } from "react"

export function ReferenceLampForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Input Details</CardTitle>
        <CardDescription>
          Fill in the details for the reference lamp data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-6 grid-cols-5">
          <MaterialInput />
          <MinInput />
          <MaxInput />

          <Button className="leading-tight self-end" size="lg">
            Automated
            <br />
            Calibration
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MaterialInput() {
  const inputId = useId()
  const [material, setMaterial] = useGlobalStore(s => [s.material, s.setMaterial])

  return (
    <div className="flex flex-col gap-2 col-span-2">
      <Label htmlFor={inputId}>Material</Label>
      <Select value={material} onValueChange={setMaterial}>
        <SelectTrigger id={inputId}>
          <SelectValue placeholder="Select material" />
        </SelectTrigger>
        <SelectContent>
          {LAMP_MATERIALS.map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  )
}

function MinInput() {
  const inputId = useId()
  const rangeMin = useGlobalStore(s => s.rangeMin)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>Min. wavelength</Label>
      <Input id={inputId} type="text" value={`${rangeMin} Å`} className="tabular-nums disabled:opacity-100 disabled:cursor-default" disabled />
    </div>
  )
}

function MaxInput() {
  const inputId = useId()
  const rangeMax = useGlobalStore(s => s.rangeMax)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>Max. wavelength</Label>
      <Input id={inputId} type="text" value={`${rangeMax} Å`} className="tabular-nums disabled:opacity-100 disabled:cursor-default" disabled />
    </div>
  )
}
