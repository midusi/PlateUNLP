import {useState} from "react"
import FieldInput from "./FieldInput"
import FieldSelect from "./FieldSelect"

export default function InputCard(){
    const [material, setMaterial] = useState<string>('')
    const [min, setMin] = useState<number>(0)
    const [max, setMax] = useState<number>(20000)

    return (
        <section className="my-8">
            <h1 className="font-bold">Input details</h1>
            <div className="bg-blue-100 border border-gray-500 
                            rounded-xl px-8 py-4 mt-2 grid grid-rows-1 
                            grid-cols-4 grid-flow-col">

                <FieldSelect name='Material' value={material} onChange={setMaterial}/>
                <FieldInput name='Min' type='number' value={min} onChange={setMin}/>
                <FieldInput name='Max' type='number' value={max} onChange={setMax}/>
                
                <div className="mx-2 flex items-end">
                    <button className='border border-gray-400 px-2 px-4 bg-[#29B6F6] 
                            text-white font-bold rounded border-none' 
                        onClick={() => console.log('Click')}
                        disabled={false}>
                            AUTOMATED DETECTION
                    </button>
                </div>
            </div>                
        </section>
    );
}