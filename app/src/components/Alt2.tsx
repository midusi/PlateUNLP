import { useRef, useMemo, useState } from "react";
import { 
  ComposedChart, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Brush, 
  ResponsiveContainer, AreaChart, Area, Bar, Line
} from 'recharts';
import fileData from '../../generated/spectrums.json';

interface LampReferenceSpectrumProps {
  material: string;
}

interface BrushRange {
  startIndex?: number;
  endIndex?: number;
}

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

export default function LampReferenceSpectrum ({material}:LampReferenceSpectrumProps) {
  const {data, xMin, xMax, yMin, yMax} = useMemo(() => {
    const data = extractMaterialSpectralData(material)
    return {
      data,
      xMin: Math.min(...data.map(d => d.x)),
      xMax: Math.max(...data.map(d => d.x)),
      yMin: Math.min(...data.map(d => d.y)),
      yMax: Math.max(...data.map(d => d.y)),
    }
  }, [material])

  const [range, setRange] = useState({start: 0, end: data.length - 1})

  // const rangeRef = useRef([data[0].x, data[data.length - 1].x]);

  // Filtrar los datos según el rango seleccionado
  //const filteredData = data.filter(d => d.x >= dataRange[0] && d.x <= dataRange[1]);

  /* </><div className="bg-yellow-50 px-8 py-4" style={{ width: '100%', height: 400 }}></div> */
  return (
    <>
        <AreaChart height={500} width={850} data={data}>
            <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
            </defs>
            <XAxis dataKey="x" label={{ value: "Wavelength (Å)", position: 'bottom', offset: 0 }}
                domain={[data[range.start].x, data[range.end].x]} 
                tickFormatter={(x) => Math.round(x).toString()} tickMargin={2}
                type='number' allowDataOverflow={true} />
            <YAxis dataKey="y" label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                domain={[yMin, yMax]} />
            <Tooltip content={<CustomTooltip />} offset={50} />
            <Area type="monotone" dataKey="y" dot={false} stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
    </>
  );
}

function CustomTooltip({ active, payload}: any) {
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