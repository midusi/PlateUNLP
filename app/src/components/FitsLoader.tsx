import { useState, ChangeEvent } from "react";
import FitsViewer from "./FitsViewer";

export default function FitsLoader({}) {
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState<any | null>(null);

  console.log(fileContent);
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      const file = event.target.files[0];
      setLoading(true);

      // Crear un FileReader para leer el archivo como ArrayBuffer
      const reader = new FileReader();
      reader.onload = function (e) {
        if (e.target?.result) {
          const fileBuffer = e.target.result as ArrayBuffer;

          // Usar la función readFITS para extraer headers y datos
          const { headers, data } = readFITS(fileBuffer);

          // Almacenar los resultados en el estado
          setFileContent({ headers, data });
          setLoading(false);
        }
      };

      // Leer el archivo como ArrayBuffer
      reader.readAsArrayBuffer(file);

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

// Función para leer un archivo FITS crudo y extraer headers y datos
function readFITS(fileBuffer: ArrayBuffer) {
  const headerSize = 2880;  // Cada bloque de headers tiene 2880 bytes (36 líneas de 80 caracteres)
  let headers: string[] = [];
  let offset = 0;

  // Leer headers
  while (true) {
      // Leer bloques de 80 bytes
      const block = fileBuffer.slice(offset, offset + headerSize);
      const header = new TextDecoder().decode(block); // Decodifica en texto
      
      // Dividir el bloque en líneas de 80 caracteres
      const lines = header.match(/.{1,80}/g);
      
      // Agregar cada línea al array de headers
      if (lines) {
        headers = headers.concat(lines);
      }
      
      // Verificar si encontramos la palabra "END", que indica el final de los headers
      if (header.includes('END')) {
        break;
      }
      
      // Mover el offset para leer el siguiente bloque
      offset += headerSize;
  }

  // Imprimir headers
  console.log("Headers:");
  headers.forEach((line) => console.log(line.trim()));

  // Ahora los datos empiezan después de los headers
  const dataStart = offset + headerSize;
  const data = fileBuffer.slice(dataStart);

  // Retornar headers y datos
  return {
      headers,
      data
  };
}