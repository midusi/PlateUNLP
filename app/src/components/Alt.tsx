import Plot from "react-plotly.js";
import fileData from '../../generated/spectrums.json';

interface LampReferenceSpectrumProps {
  material: string;
}

export default function App({material}:LampReferenceSpectrumProps) {

  function extractMaterialSpectralData(material:string) {
    const materialList = material.split("-");
    const nistData = fileData.datasets.find((i) => i.id === "nist");
    const materials = materialList.flatMap((m) => [m, `${m} I`, `${m} II`]);
    const data = nistData?.points
      .filter((i) => materials.includes(i.material))
      .map((d) => ({ x: d.wavelength, y: d.intensity })) || [];
    return data;
  }

  const data = extractMaterialSpectralData(material);

  // Separar los arrays de x e y
  const xValues = data.map((d:{x: number; y: number;}) => d.x);
  const yValues = data.map((d:{x: number; y: number;}) => d.y);

  return (
    <Plot
      data={[{
          x: xValues,
          y: yValues,
          type: "scatter",
          mode: "lines",          // Mostrar solo líneas, sin marcadores "lines+markers"
          fill: "tozeroy",        // Rellenar el área bajo la curva
          marker: { color: "red" },
        }]}
      layout={{
        width: 800,
        height: 400,
        title: "Lamp Reference Spectrum",
        xaxis: {
          rangeslider: { visible: true }, // Mostrar un selector de rango debajo del gráfico
        },
        paper_bgcolor: "#fffbeb",   // Color de fondo total del gráfico
        plot_bgcolor: "#ffffff",    // Color de fondo donde se dibuja el gráfico
      }}
      useResizeHandler={true}    // Habilitar el redimensionamiento
      style={{ width: "100%" }}  // Hacer que el gráfico sea tan ancho como su contenedor
    />
  );
}
