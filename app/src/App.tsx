import FitsLoader from "./components/FitsLoader"
import MaterialReferenceForm from "./components/LampReferenceForm"

export default function App() {
  return (
    <main className="max-w-4xl mx-auto">
      <MaterialReferenceForm />
      <FitsLoader />
    </main>
  )
}
