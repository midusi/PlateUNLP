import { useStore } from "@tanstack/react-form"
import clsx from "clsx"
import { Search } from "lucide-react"
import { useState } from "react"
import defaultImage from "~/assets/avatar.png"
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field"
import { Input } from "~/components/ui/input"
import { useFieldContext } from "~/hooks/use-app-form-context"
import { Checkbox } from "../ui/checkbox"

type UserRole = { id: string; role: "owner" | "editor" | "viewer" }

type SelectUsersFieldProps = {
  ownerId: string
  className?: string
  label: React.ReactNode
  description?: React.ReactNode
  users: {
    id: string
    name: string
    email: string
    image: string
  }[]
  initialsUsersRoles?: UserRole[]
} & Pick<React.ComponentProps<typeof Input>, "placeholder">

export function SelectUsersField({
  ownerId,
  className,
  label,
  description,
  users,
}: SelectUsersFieldProps) {
  const field = useFieldContext<UserRole[]>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  // Busqueda por email
  const [emailSearchTerm, setEmailSearchTerm] = useState<string>("")

  const selectedUsersRoles = field.state.value

  /** Filtrar usuarios que no cumplen el criterio de busqueda de email */
  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(emailSearchTerm.toLowerCase()),
  )

  /** Usuarios a mostrar ordenados alfabeticamente por nombre de usuario */
  filteredUsers.sort((a, b) => {
    return a.name.localeCompare(b.name)
  })

  /** Recuperar rol actual de un usuario dado su id */
  function getUserRole(userId: string) {
    const user = selectedUsersRoles.find((u) => u.id === userId)
    return user ? user.role : "-"
  }

  /** Manejar cambio de rol de un usuario */
  function handleRoleChange(userId: string, newRole: string) {
    /** Si el nuevo rol es "-" quitar al usuario de la lista */
    if (newRole === "-") {
      field.handleChange(selectedUsersRoles.filter((user) => user.id !== userId))
    } else {
      /** Si ya existia en la lista cambia su valor, sino lo agrega */
      if (selectedUsersRoles.some((u) => u.id === userId)) {
        field.handleChange(
          selectedUsersRoles.map((user) =>
            user.id === userId ? { ...user, role: newRole as "editor" | "viewer" } : user,
          ),
        )
      } else {
        field.handleChange([
          ...selectedUsersRoles,
          { id: userId, role: newRole as "editor" | "viewer" },
        ])
      }
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
          <div
            key={user.id}
            className={clsx(
              "flex w-full cursor-pointer items-center justify-between border-b p-2",
              getUserRole(user.id) !== "-" && "bg-gray-100",
            )}
          >
            <div className="flex w-full flex-row items-center gap-4">
              <img
                src={user.image ? user.image : defaultImage}
                alt={user.name}
                className="h-8 w-8 rounded-full border border-black bg-blue-100 object-cover"
              />
              <div className="flex w-full flex-col ">
                <span className="flex w-full cursor-pointer justify-start">{user.name}</span>
                <span className="flex cursor-pointer justify-start text-gray-700">
                  {user.email}
                </span>
              </div>
            </div>
            {/* Select element for roles */}
            {user.id === ownerId ? (
              // Mostrar el rol de owner no seleccionable
              <span className="flex-shrink-0 rounded-md border bg-gray-200 p-1 text-sm">Owner</span>
            ) : (
              // Mostrar el select para los demás usuarios
              <select
                value={getUserRole(user.id)}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                className="flex-shrink-0 rounded-md border p-1 text-sm"
              >
                <option value="-">-</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            )}
          </div>
        ))}
      </div>

      {description && <FieldDescription>{description}</FieldDescription>}
      {errors.length > 0 && <FieldError>{errors[0].message}</FieldError>}
    </Field>
  )
}
