import { useStore } from "@tanstack/react-form"
import { X } from "lucide-react"
import { MouseEventHandler, useEffect, useRef, useState } from "react"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useFieldContext } from "~/hooks/use-app-form-context"
import { notifyError } from "~/lib/notifications"
import defaultUserImage from "~/assets/avatar.png"

type TextFieldProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
  value?: string | null
  type?: string
  hight_modifier?: string
  disabled?: boolean,
  accept?: string,
  showPreview?: boolean,
  maxWidth?: number
  maxHeight?: number
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

export function ImageField({
  className,
  label,
  description,
  value = null,
  type,
  hight_modifier,
  disabled,
  accept = "image/png,image/jpeg,image/jpg,image/webp,image/gif",
  showPreview = true,
  maxWidth = 512,
  maxHeight = 512,
  ...props
}: TextFieldProps) {
  const field = useFieldContext<string | null>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  const [preview, setPreview] = useState<string | null>(value)
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)  {
      notifyError("Failed to load file")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string

      const img = new Image()
      img.onload = () => {
        if (maxWidth && img.width > maxWidth || maxHeight && img.height > maxHeight) {
          notifyError(`Image shape exceeds the maximum of ${maxWidth}pxX${maxHeight}px`)
          return
        }
        console.log("Image loaded with size:", img.width, "x", img.height)
        setPreview(base64)
        field.handleChange(base64)
      }
      img.src = base64
    }
    
    reader.readAsDataURL(file)
  }

  const handleClear = () => {
    field.handleChange(null)
    setPreview(null)

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <Field className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <Input
        {...props} 
        ref={inputRef}
        accept={accept}
        className={`disabled:bg-gray-200 ${hight_modifier}`}
        type="file"
        name={field.name}
        //value={field.state.value}
        onBlur={field.handleBlur}
        onChange={handleFileChange}
      />

      {showPreview && preview && preview != defaultUserImage && (
        <div className="relative rounded-lg border border-border overflow-hidden w-fit">
          <img 
            src={preview}
            alt="Preview"
            className="h-32 object-cover"
          />
           <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors disabled:opacity:90"
            aria-label="Delete image"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
