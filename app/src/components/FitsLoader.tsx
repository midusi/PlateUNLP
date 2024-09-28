import { useState, useMemo } from "react";
import FitsViewer from "./FitsViewer"
import 'fitsjs';

export default function FitsLoader ({}) {
    const [loading, setLoading] = useState(false);
    const [fileContent, setFileContent] = useState<any | null>(null);
    
    console.log(fileContent)
    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.files) {
            const file = event.target.files[0];
            setLoading(true);

            // Callback para manejar el archivo FITS una vez cargado
            const callback = function() {
                const hdu = this.getHDU(); // Obtiene la primera unidad de encabezado-datos
                const header = hdu.header;  // Obtiene el encabezado
                const dataunit = hdu.data;   // Obtiene la unidad de datos

                // Procesar datos como desees
                console.log('Header:', header);
                console.log('Data:', dataunit);

                // Almacenar los resultados en el estado
                setFileContent({ header, dataunit });
                setLoading(false);
            };

            // Inicializa el objeto FITS utilizando el archivo
            const fits = new astro.FITS.File(file, callback);
        }
    }

    return (
        <>
            <input type="file" id="fileInput" onChange={handleFileChange} accept=".fits" />
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