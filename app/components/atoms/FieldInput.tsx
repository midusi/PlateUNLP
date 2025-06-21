interface FieldProps {
  name: string
  type: string
  value: any
  onChange: (x: any) => void
}

export default function FieldInput({
  name,
  type,
  value,
  onChange,
}: FieldProps) {
  return (
    <div className="mx-2">
      <label>{name}</label>
      <input
        className="bg-white border border-gray-400 px-2"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
