import {useState} from "react"
import Field from "./Field"

export default function InputCard(){
    const [material, setMaterial] = useState<string | null>(null)
    console.log(material)

    return (
        <section className="my-8">
            <h1>Input details</h1>
            <div className="bg-blue-100 border border-gray-500 
                            rounded-xl px-8 py-4 mt-2 grid grid-rows-1 
                            grid-cols-4 grid-flow-col">
                <label>Select material</label>
                <select 
                    className="bg-white border border-gray-400 px-2" 
                    value={material ?? ""}
                    onChange={e => setMaterial(e.target.value)}
                >
                    <option value='a'> He-Ne-Ar </option>
                    <option value='b'> Fe-Ne </option>
                </select>
                <Field name='Min'/>
                <Field name='Max'/>
            </div>                
        </section>
    );
}