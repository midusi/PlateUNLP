import { useState } from "react";
import MaterialReferenceForm from "./components/LampReferenceForm";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="max-w-4xl mx-auto">
      <MaterialReferenceForm />
    </main>
  );
}



