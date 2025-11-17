import { useStore } from "@tanstack/react-form"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useFieldContext } from "~/hooks/use-app-form-context"

type PasswordFieldProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

export function PasswordField({ className, label, description, ...props }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="relative">
        <Input
          {...props}
          type={showPassword ? "text" : "password"}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
          tabIndex={-1} // evita que se pueda tabular al ojito
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
