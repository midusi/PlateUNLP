import { useRef } from "react";
import { 
  ComposedChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Brush, 
  ResponsiveContainer 
} from 'recharts';
import fileData from '../../generated/spectrums.json';

interface MaterialReferenceLampProps {
  material: string; // Define el tipo de material como string
}

interface BrushRange {
  startIndex?: number;
  endIndex?: number;
}

export default function MaterialReferenceLamp ({material}:MaterialReferenceLampProps) {

  function extractMaterialSpectralData(material:string) {
    const materialList = material.split('-')
    const nistData = fileData.datasets.find(i => i.id === 'nist')
    const materials = materialList.flatMap(m => [m, `${m} I`, `${m} II`]);
    const data = nistData?.points
      .filter(i => materials.includes(i.material))
      .map(d => { return {'x':d.wavelength, 'y':d.intensity, 'material':d.material}}) || []

    // if (data.length === 0) {
    //   throw new Error("El arreglo de datos a mostrar esta vacio. data="+data);
    // }
    return data;
  }

  const data = extractMaterialSpectralData(material)
  const xMin = Math.min(...data.map(d => d.x));
  const xMax = Math.max(...data.map(d => d.x));
  const yMin = Math.min(...data.map(d => d.y));
  const yMax = Math.max(...data.map(d => d.y));
  const rangeRef = useRef([data[0].x, data[data.length - 1].x]);

  function handleBrushChange(newRange: BrushRange) {
    if (newRange.startIndex !== undefined && newRange.endIndex !== undefined) {
      rangeRef.current = [newRange.startIndex, newRange.endIndex]
      console.log(rangeRef.current);
    } else {
      throw new Error("La variable newRange tiene valores sin definir. newRange="+newRange);
    }
  };  

  // Filtrar los datos según el rango seleccionado
  //const filteredData = data.filter(d => d.x >= dataRange[0] && d.x <= dataRange[1]);

  /* </><div className="bg-yellow-50 px-8 py-4" style={{ width: '100%', height: 400 }}></div> */
  return (
    <div className="a" style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 50 }}
        >
          <CartesianGrid />
          <XAxis dataKey="x" domain={[xMin, xMax]} />
          <YAxis dataKey="y" domain={[yMin, yMax]} />
          <Tooltip content={<CustomTooltip />} offset={50}/>
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
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const { x, material } = payload[0].payload;
    return (
      <div className="custom-tooltip bg-white p-2 border border-gray-300">
        <p>{`Wavelength (Å): ${x}`}</p>
        <p>{`Material: ${material}`}</p>
      </div>
    );
  }
}