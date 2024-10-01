import { ReferenceLampForm } from "@/components/ReferenceLampForm"
import { ReferenceLampRange } from "@/components/ReferenceLampRange"
import { ReferenceLampSpectrum } from "@/components/ReferenceLampSpectrum"
import FitsLoader from "./components/FitsLoader"

export default function App() {
  return (
    <main className="max-w-6xl mx-auto">
      <h1 className="text-center mt-12 mb-16 text-4xl font-bold tracking-tight lg:text-5xl">
        🌌 PlateUNLP
      </h1>

      <ReferenceLampForm />

      <section className="space-y-0 my-8">
        <ReferenceLampRange />
        <ReferenceLampSpectrum />
        <FitsLoader />
      </section>
    </main>
  )
}
