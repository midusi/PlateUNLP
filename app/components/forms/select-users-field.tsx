import { useStore } from "@tanstack/react-form"
import clsx from "clsx"
import { Search } from "lucide-react"
import { useState } from "react"
import defaultImage from "~/assets/avatar.png"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useFieldContext } from "~/hooks/use-app-form-context"
import { Checkbox } from "../ui/checkbox"

type SelectUsersFieldProps = {
  className?: string
  label: React.ReactNode
  description?: React.ReactNode
  users: {
    id: string
    name: string
    email: string
    image: string
  }[]
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

export function SelectUsersField({ className, label, description, users }: SelectUsersFieldProps) {
  const field = useFieldContext<string[]>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  // Busqueda por email
  const [emailSearchTerm, setEmailSearchTerm] = useState<string>("")

  const selectedUsers = field.state.value

  /** Filtrar usuarios que no cumplen el criterio de busqueda de email */
  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(emailSearchTerm.toLowerCase()),
  )

  /** Usuarios a mostrar ordenados alfabeticamente por nombre de usuario */
  filteredUsers.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })

  function onClick(userId: string) {
    if (selectedUsers.some((id) => id === userId)) {
      field.handleChange(selectedUsers.filter((id) => id !== userId))
    } else {
      field.handleChange([...selectedUsers, userId])
    }
  }

  return (
    <Field className={className}>
      {label && <FieldLabel>{label}</FieldLabel>}

      <div className="relative flex flex-row">
        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search by email..."
          value={emailSearchTerm}
          onChange={(e) => setEmailSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="h-[200px] w-full overflow-y-auto border">
        {filteredUsers.map((user) => (
          <button
            type="button"
            key={user.id}
            className={clsx(
              "flex w-full cursor-pointer items-center justify-between border-b p-2",
              selectedUsers.some((id) => id === user.id) && "bg-gray-100",
            )}
            onClick={() => onClick(user.id)}
          >
            <div className="flex w-full flex-row items-center gap-4">
              <img
                src={user.image ? user.image : defaultImage}
                alt={user.name}
                className="h-8 w-8 rounded-full border border-black bg-blue-100 object-cover"
              />
              <div className="flex w-full flex-col ">
                <label className="flex w-full cursor-pointer justify-start">{user.name}</label>
                <label className="flex cursor-pointer justify-start text-gray-700">
                  {user.email}
                </label>
              </div>
            </div>
            <Checkbox checked={selectedUsers.some((id) => id === user.id)} />
          </button>
        ))}
      </div>

      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
