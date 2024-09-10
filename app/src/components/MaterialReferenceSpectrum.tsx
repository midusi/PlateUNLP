import { useRef } from "react";
import { 
  ComposedChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Brush, 
  ResponsiveContainer 
} from 'recharts';
import fileData from '../../generated/spectrums.json';

const nistData = fileData.datasets.find(i => i.id === 'nist')
const materials = ['He', 'Ne', 'Ar'].flatMap(m => [m, `${m} I`, `${m} II`]);
const data = nistData?.points
  .filter(i => materials.includes(i.material))
  .map(d => { return {'x':d.wavelength, 'y':d.intensity, 'material':d.material}}) || []
console.log(data.length)
if (data.length === 0) {
  throw new Error("El arreglo de datos a mostrar esta vacio. data="+data);
}

// Datos de ejemplo
// const data = Array.from({ length: 100 }, (_, index) => ({
//   x: index,
//   y: Math.sin(index / 10) * 100 + Math.random() * 50
// }));

console.log(data)

//console.log(data.filter(d => (d.x===undefined) || (d.y===undefined) || (d.material===undefined)))

interface BrushRange {
  startIndex?: number;
  endIndex?: number;
}

export default function MaterialReferenceSpectrum () {
  // const rangeRef = useRef([data[0].x, data[data.length - 1].x]);

  //console.log(rangeRef)

  const xMin = Math.min(...data.map(d => d.x));
  const xMax = Math.max(...data.map(d => d.x));
  const yMin = Math.min(...data.map(d => d.y));
  const yMax = Math.max(...data.map(d => d.y));

  function handleBrushChange(newRange: BrushRange) {
    if (newRange.startIndex !== undefined && newRange.endIndex !== undefined) {
      // rangeRef.current = [newRange.startIndex, newRange.endIndex]
      // console.log(rangeRef.current);
    } else {
      throw new Error("La variable newRange tiene valores sin definir. newRange="+newRange);
    }
  };  

  // Filtrar los datos según el rango seleccionado
  //const filteredData = data.filter(d => d.x >= dataRange[0] && d.x <= dataRange[1]);

  return (
      <section className="my-8">
          <h1 className="font-bold">Material Reference Spectrum</h1>
          <div className="bg-yellow-50 px-8 py-4" style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <ComposedChart
                data={data}
                margin={{ top: 20, right: 20, bottom: 20, left: 50 }}
              >
                <CartesianGrid />
                <XAxis dataKey="x" domain={[xMin, xMax]} />
                <YAxis dataKey="y" domain={[yMin, yMax]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="y" stroke="#ff7300" />
                <Brush
                  dataKey="x"
                  startIndex={0}
                  endIndex={data.length - 1}
                  onChange={handleBrushChange}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>                
      </section>
  );
}