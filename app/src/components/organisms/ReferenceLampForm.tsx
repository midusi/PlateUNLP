import { useId } from "react"
import { Button } from "@/components/atoms/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card"
import { Label } from "@/components/atoms/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select"
import { useGlobalStore } from "@/hooks/use-global-store"
import { LAMP_MATERIALS } from "@/lib/spectral-data"

export function ReferenceLampForm() {
  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Input Details</CardTitle>
        <CardDescription>
          Fill in the details for the reference lamp data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <MaterialInput />
        </div>
        <div className="flex justify-center">
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
  const [material, setMaterial, oneTeoricalSpectrum, setOneTeoricalSpectrum] =
    useGlobalStore((s) => [
      s.material,
      s.setMaterial,
      s.oneTeoricalSpectrum,
      s.setOneTeoricalSpectrum,
    ])

  return (
    <div className="flex flex-col gap-2 col-span-2">
      <Label htmlFor={inputId}>Material</Label>
      <Select value={material} onValueChange={setMaterial}>
        <SelectTrigger id={inputId}>
          <SelectValue placeholder="Select material" />
        </SelectTrigger>
        <SelectContent>
          {LAMP_MATERIALS.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div>
        <input
          type="checkbox"
          id="checkbox-display-materials-in-a-single-spectrum"
          className="mr-2 cursor-pointer"
          checked={oneTeoricalSpectrum}
          onChange={(e) => setOneTeoricalSpectrum(e.target.checked)}
        />
        <label
          htmlFor="checkbox-display-materials-in-a-single-spectrum"
          className="cursor-pointer"
        >
          Display materials in a single spectrum
        </label>
      </div>
    </div>
  )
}
