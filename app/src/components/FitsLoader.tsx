import { useState } from "react";
import FitsViewer from "./FitsViewer";

export default function FitsLoader({}) {
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState<any | null>(null);

  console.log(fileContent);
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const file = event.target.files[0];
      setLoading(true);


      // // Almacenar los resultados en el estado
      // setFileContent({ header, dataunit });
      // setLoading(false);

    }
  }

  return (
    <>
      <input
        type="file"
        id="fileInput"
        onChange={handleFileChange}
        accept=".fits"
      />
      {loading && <p>Cargando contenido...</p>}
      {fileContent && <FitsViewer content={fileContent} />}
    </>
  );
}

// function parseFits(buffer: ArrayBuffer): FitsHeader {
//     // Usar la biblioteca fitsjs para leer el encabezado
//     const fitsData = readFITS(buffer);
//     const header: FitsHeader = {};

//     // Iterar sobre los encabezados y almacenar en el objeto
//     for (const key in fitsData.header) {
//         if (fitsData.header.hasOwnProperty(key)) {
//             const value = fitsData.header[key];
//             header[key.toUpperCase()] = value; // Clave en mayúsculas
//         }
//     }

//     return header;
// };
