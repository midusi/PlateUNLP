import FitsLoader from "./components/FitsLoader"
import MaterialReferenceForm from "./components/LampReferenceForm"

export default function App() {
  return (
    <main className="max-w-4xl mx-auto">
      <h1 className="text-center mt-12 mb-16 text-4xl font-bold tracking-tight lg:text-5xl">
        🌌 PlateUNLP
      </h1>

      <MaterialReferenceForm />
      <FitsLoader />
    </main>
  )
}
