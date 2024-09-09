import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import InputCard from "./components/InputCard";
import MaterialReferenceSpectrum from "./components/MaterialReferenceSpectrum";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="max-w-4xl mx-auto">
      <InputCard/>
      <MaterialReferenceSpectrum/>
    </main>
  );
}



