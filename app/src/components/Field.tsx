

export default function Field({name}){
    return <div className="mx-2">
            <label> {name} </label>
            <input className="bg-white border border-gray-400 px-2" />
        </div>;
}