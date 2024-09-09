interface FieldProps {
    name: string;
    value: string;
    onChange: (value: string) => void
}

const options = ['He-Ne-Ar', 'Fe-Ne-Ar', 'Fe-Ne']

export default function FieldSelect ({name, value, onChange}:FieldProps) {

    return <div className="mx-2">
            <label> {name} </label>
            <select 
                className="bg-white border border-gray-400 px-2 w-full h-6" 
                value={value ?? ""}
                onChange={e => onChange(e.target.value)}
            >
                {options.map(op => 
                    <option key={op}> {op} </option>
                )}
            </select>
        </div>;
}