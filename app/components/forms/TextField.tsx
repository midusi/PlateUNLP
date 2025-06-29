import { useStore } from "@tanstack/react-form"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { useFieldContext } from "~/hooks/use-app-form-context"

/**
 * `TextField` component is a simple text input field with a label.
 */
export default function TextField({
  className,
  label,
  placeholder,
}: {
  className?: string
  label: string
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input
        className="my-0.5"
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
      />
      {errors.length > 0 && <p className="text-red-500 text-sm">{errors[0].message}</p>}
    </div>
  )
}
