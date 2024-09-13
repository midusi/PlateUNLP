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
    <ResponsiveContainer height={500} width={'100%'}>
      <ComposedChart
        data={data}
        margin={{ top: 80, right: 20, bottom: 20, left: 50 }}
      >
        <CartesianGrid /> 
        <XAxis dataKey="x" label={{ value: "Wavelength (Å)", position: 'bottom', offset: 0 }} 
        domain={[data[range.start].x, data[range.end].x]} tickFormatter={(x) => Math.round(x).toString()} tickMargin={2}
        type='number' allowDataOverflow={true}/>
        <YAxis dataKey="y" label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }} 
        domain={[yMin, yMax]} />
        <Tooltip content={<CustomTooltip />} offset={50}/>
        <Legend />
        <Area type="monotone" dataKey="y" dot={false} stroke="#8884d8" fill="#8884d8"/>
        <Brush
          data={data}
          dataKey="x"
          startIndex={range.start}
          endIndex={range.end}
          onChange={(newRange) => {
            if (newRange.startIndex !== undefined && newRange.endIndex !== undefined) {
              // rangeRef.current = [newRange.startIndex, newRange.endIndex]
              setRange({start: newRange.startIndex, end: newRange.endIndex})
            } else {
              throw new Error("La variable newRange tiene valores sin definir. newRange="+newRange);
            }
          }}
          
          type="number"
          height={60}
          y={0}
          tickFormatter={(x) => Math.round(x).toString()}
        >
          <AreaChart data={data}>
            <XAxis hide dataKey="x" domain={[xMin, xMax]}
            type='number' allowDataOverflow={true}/>
            <YAxis hide domain={[yMin, yMax]} />
            <Area type="monotone" dataKey="y" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </Brush>
      </ComposedChart>
    </ResponsiveContainer>
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