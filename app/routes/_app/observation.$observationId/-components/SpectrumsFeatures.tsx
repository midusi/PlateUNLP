import { Card, CardContent} from "~/components/ui/card"
import type { getSpectrums } from "../-actions/get-spectrums"

export function SpectrumsFeatures({
  observationId,
  spectrums,
}: {
  observationId: string
  spectrums: Awaited<ReturnType<typeof getSpectrums>>
}) {

  return (
    <Card>
    <CardContent>
        <div className="grid grid-cols-3 justify-center content-normal gap-4">
        
        </div>
    </CardContent>
    </Card>
  )
}