import { ReferenceLampForm } from "@/components/ReferenceLampForm";
import { ReferenceLampRange } from "@/components/ReferenceLampRange";
import { ReferenceLampSpectrum } from "@/components/ReferenceLampSpectrum";
import FitsLoader from "./components/FitsLoader";
import { cn } from "@/lib/utils"

export default function App() {
  return (
    <div className="max-w-6xl px-8 mx-auto">
      <header>
        <h1 className="text-center mt-12 mb-16 text-4xl font-bold tracking-tight lg:text-5xl">
          🌌 PlateUNLP
        </h1>
      </header>

      <main>
        <ReferenceLampForm />

        <section className="space-y-0 my-8">
          <ReferenceLampRange />
          <ReferenceLampSpectrum />
          <h1 className={cn("text-2xl font-bold")}>Empirical Comparison Lamp</h1>
          <FitsLoader />
          <h1 className={cn("text-2xl font-bold")}>Empirical Spectrum</h1>
          <FitsLoader />
        </section>
      </main>

      <footer className="mt-40 mb-20 text-xs italic text-center text-muted-foreground">
        Copyright @{new Date().getFullYear()} III-LIDI, Facultad de Informática,
        Universidad Nacional de la Plata
      </footer>
    </div>
  );
}
