interface FitsViewerProps {
  content: { header: any, data: any }
}

export default function FitsViewer({ content }: FitsViewerProps) {
  console.log(content)

  return (
    <div>
      <h3>Encabezado FITS:</h3>
      <pre>{JSON.stringify(content.header, null, 2)}</pre>
      <h3>Datos:</h3>
      <pre>{content.data ? "Datos cargados" : "No hay datos disponibles"}</pre>
    </div>
  )
}

// const formatContent = (content: string | ArrayBuffer | null) => {
//     if (content === null) return "No hay contenido disponible";
//     if (typeof content === "string") return content; // Si ya es string, retornarlo directamente
//     if (content instanceof ArrayBuffer) {
//         const uint8Array = new Uint8Array(content);
//         return uint8Array.join(', '); // Convertir a string (puedes cambiar esto según tu necesidad)
//     }
//     return "Contenido no soportado"; // Mensaje para otros tipos
// };
