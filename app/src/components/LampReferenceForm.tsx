import {useState} from "react"
import FieldInput from "./FieldInput"
import FieldSelect from "./FieldSelect"
import LampReferenceSpectrum from "./LampReferenceSpectrum";

const options = ['He-Ne-Ar', 'Fe-Ne-Ar', 'Fe-Ne']

export default function InputCard(){
    const [material, setMaterial] = useState<string>(options[0])
    const [min, setMin] = useState<number>(0)
    const [max, setMax] = useState<number>(20000)

    return (
        <section className="my-8">
            <h1 className="font-bold">Lamp Reference Spectrum</h1>
            <div className="bg-yellow-50 px-8 py-4 mt-2 ">

                <FieldSelect name='Material' value={material} options={options} onChange={setMaterial}/>
                <div className="grid grid-rows-1 grid-cols-3 grid-flow-col px-8 py-4">
                    <FieldInput name='Min' type='number' value={min} onChange={setMin}/>
                    <FieldInput name='Max' type='number' value={max} onChange={setMax}/>
                    <div className="mx-2 flex items-end">
                        <button className='border border-gray-400 px-2 px-4 bg-[#29B6F6] 
                                text-white font-bold rounded border-none' 
                            onClick={() => console.log('Click')}
                            disabled={true}>
                                AUTOMATED CALIBRATION
                        </button>
                    </div>
                </div>
                <LampReferenceSpectrum material={material}/>

            </div>                
        </section>
    );
}