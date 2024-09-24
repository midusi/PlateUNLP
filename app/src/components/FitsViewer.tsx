import { useState } from "react";


export default function FitsViewer ({}) {
    const [selectedFile, setSelectedFile] = useState<File|null>(null);

    const handleFileChange = (event:React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]); // Obtener el archivo seleccionado
        }
    };

    console.log(selectedFile)

    return (
        <>
            {!selectedFile 
                ? <input type="file" id="fileInput" onChange={handleFileChange} />
                : <p>Archivo elegido: {selectedFile.name}</p> 
            }
        </>
      );
}