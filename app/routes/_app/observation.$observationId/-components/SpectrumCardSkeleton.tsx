import { Card } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"

/**
 * Esqueleto de la tarjeta de un espectro, con la misma estructura que
 * `SpectrumCard` (menu, imagen y grafico), mientras se calcula la extraccion.
 */
export function SpectrumCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0" aria-busy="true">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-olive-300 border-b px-4 py-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-5 min-w-20 flex-1" />
        <Skeleton className="h-5 min-w-20 flex-1" />
        <Skeleton className="ml-auto size-9" />
      </div>
      <Skeleton className="h-14 w-full rounded-none" />
      <div className="flex h-[140px] items-center justify-center">
        <p className="text-muted-foreground text-sm">Calculating spectral vectors…</p>
      </div>
    </Card>
  )
}
