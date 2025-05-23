import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./selectComponents"

interface SelectFormProps {
  field: any
  options: { label: string; value: string }[]
  className?: string
  error?: any
}

const SelectForm: React.FC<SelectFormProps> = ({
  field,
  options,
  className,
  error,
}) => {
  return (
    <div className="flex flex-col">
      <Select onValueChange={field.onChange} value={field.value}>
        <SelectTrigger className={`${className}`}>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-red-500">{error.message}</p>}
    </div>
  )
}

export default SelectForm
