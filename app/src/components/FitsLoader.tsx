import { useState, ChangeEvent } from "react";
import Json1DPlot from "./Json1DPlot";
import { cn } from "@/lib/utils"

const LoadingStates = {
  WAITING: 0,
  INPROCCES: 1,
  FINISHED: 2,
  ERROR: 3,
};

interface JsonData {
  pixel: string,
  intensity: string
}

export default function FitsLoader({ }) {
  const [loadingState, setLoadingState] = useState(LoadingStates.WAITING);
  const [fileContent, setFileContent] = useState<any | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const file = event.target.files[0];
      setLoadingState(LoadingStates.INPROCCES);
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        if (reader.result) {
          try {
            const jsonContent = JSON.parse(reader.result as string);
            const interpretedContent = jsonContent.map((item: JsonData) => ({
              pixel: parseInt(item.pixel, 10),
              intensity: parseFloat(item.intensity)
            }));
            setFileContent(interpretedContent);
            setLoadingState(LoadingStates.FINISHED);
          } catch (error) {
            console.error("Error al parsear el JSON:", error);
            setLoadingState(LoadingStates.ERROR);
          }
        }
      };
      reader.onerror = () => {
        console.error("Error al leer el archivo");
        setLoadingState(LoadingStates.ERROR);
      };
    }
  }

  return (
    <>
      <h1 className={cn("text-2xl font-bold")}>Empirical Comparison Lamp</h1>
      {loadingState != LoadingStates.FINISHED
        && <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
          accept=".json"
        />}
      {loadingState == LoadingStates.INPROCCES
        && <p>Cargando contenido...</p>}
      {fileContent
        && <Json1DPlot data={fileContent} />}
    </>
  );
}