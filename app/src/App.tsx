import { useState } from "react";
import MaterialReferenceForm from "./components/LampReferenceForm";
import FitsViewer from "./components/FitsViewer"

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="max-w-4xl mx-auto">
      <MaterialReferenceForm />
      <FitsViewer/>
    </main>
  );
}



