import { useState } from "react";
import { 
  ComposedChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, Brush, 
  ResponsiveContainer 
} from 'recharts';

// Datos de ejemplo
const data = Array.from({ length: 100 }, (_, index) => ({
  x: index,
  y: Math.sin(index / 10) * 100 + Math.random() * 50
}));

const GraphWithSelection = () => {
  //const [dataRange, setDataRange] = useState([0, 100]);

  // const handleBrushChange = (newRange: any) => {
  //   console.log('sss_: '+(newRange && newRange.length === 2))
  //   setDataRange(newRange);
  // };

  // Filtrar los datos según el rango seleccionado
  //const filteredData = data.filter(d => d.x >= dataRange[0] && d.x <= dataRange[1]);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid />
          <XAxis dataKey="x" /> {/*label="Wavelenght" */}
          <YAxis dataKey="y" />
          <Tooltip />
          {/* <Legend verticalAlign="top"/> */}
          <Line type="monotone" dataKey="y" stroke="#ff7300" />
          <Brush
            dataKey="x"
            startIndex={0}
            endIndex={99}
            // onChange={handleBrushChange}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function MaterialReferenceSpectrum ({}) {
    return (
        <section className="my-8">
            <h1 className="font-bold">Material Reference Spectrum</h1>
            <div className="bg-yellow-50 px-8 py-4 mt-2">
                {GraphWithSelection()}
            </div>                
        </section>
    );
}