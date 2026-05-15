import { Combobox } from "@base-ui/react/combobox"
import { Hashvatar } from "hashvatar/react"
import { useMemo, useState } from "react"
import { cn } from "~/lib/utils"

type Role = "admin" | "editor" | "viewer"

type User = {
  id: string
  name: string
  email: string
  image: string | null
}

type UserRole = {
  id: string
  role: Role
}

type SelectUsersProps = {
  className?: string
  label?: React.ReactNode
  description?: React.ReactNode
  users: User[]
  value: UserRole[]
  onChange: (next: UserRole[]) => void
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
]

export function SelectUsers({
  className,
  label,
  description,
  users,
  value,
  onChange,
}: SelectUsersProps) {
  const [query, setQuery] = useState("")

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  const selectedMembers = useMemo(() => {
    return value
      .map((entry) => {
        const u = usersById.get(entry.id)
        return u ? { ...u, role: entry.role } : null
      })
      .filter((u): u is User & { role: Role } => u !== null)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [value, usersById])

  const availableUsers = useMemo(() => {
    const selectedIds = new Set(value.map((u) => u.id))
    return users.filter((u) => !selectedIds.has(u.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [users, value])

  function addUser(user: User) {
    if (value.some((u) => u.id === user.id)) return
    onChange([...value, { id: user.id, role: "viewer" }])
    setQuery("")
  }

  function removeUser(userId: string) {
    onChange(value.filter((u) => u.id !== userId))
  }

  function changeRole(userId: string, newRole: Role) {
    onChange(value.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-olive-950 text-sm tracking-tight">{label}</span>
          <span className="text-olive-500 text-xs">
            {selectedMembers.length} {selectedMembers.length === 1 ? "member" : "members"}
          </span>
        </div>
      )}

      <Combobox.Root
        items={availableUsers}
        value={null}
        inputValue={query}
        onInputValueChange={(next) => setQuery(next)}
        onValueChange={(user) => {
          if (user) addUser(user as User)
        }}
        itemToStringLabel={(u) => (u as User).name}
        itemToStringValue={(u) => (u as User).id}
      >
        <div className="relative">
          <span className="icon-[ph--magnifying-glass-bold] pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-olive-400" />
          <Combobox.Input
            placeholder="Search people by name or email…"
            className={cn(
              "h-10 w-full rounded-md border border-olive-300 bg-olive-100 pr-3 pl-9 text-olive-700 text-sm",
              "placeholder:text-olive-400",
              "outline-none transition-[color,box-shadow]",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            )}
          />
        </div>

        <Combobox.Portal>
          <Combobox.Positioner sideOffset={6} className="z-50 outline-none">
            <Combobox.Popup
              className={cn(
                "max-h-72 w-(--anchor-width) overflow-y-auto rounded-md border border-olive-300 bg-stone-50",
                "shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]",
                "origin-(--transform-origin) transition-[transform,opacity]",
                "data-ending-style:scale-95 data-ending-style:opacity-0",
                "data-starting-style:scale-95 data-starting-style:opacity-0",
              )}
            >
              <Combobox.Empty className="px-3 py-6 text-center text-olive-500 text-sm empty:hidden">
                {availableUsers.length === 0
                  ? "Everyone is already a member."
                  : "No people match your search."}
              </Combobox.Empty>
              <Combobox.List>
                {(user: User) => (
                  <Combobox.Item
                    key={user.id}
                    value={user}
                    className={cn(
                      "flex cursor-pointer select-none items-center gap-3 px-3 py-2 text-sm outline-none",
                      "data-highlighted:bg-olive-100 data-highlighted:text-orange-600",
                    )}
                  >
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className="size-8 shrink-0 rounded-full border border-olive-300 object-cover"
                      />
                    ) : (
                      <Hashvatar
                        hash={user.email}
                        mode="dither"
                        size={32}
                        className="size-8 shrink-0 rounded-full border border-olive-300"
                      />
                    )}
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-olive-950">{user.name}</span>
                      <span className="truncate text-olive-500 text-xs">{user.email}</span>
                    </div>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

      <div className="overflow-hidden rounded-md border border-olive-300 bg-stone-50">
        {selectedMembers.length === 0 ? (
          <div className="px-4 py-8 text-center text-olive-500 text-sm">
            No members yet. Use the search above to add people.
          </div>
        ) : (
          <ul className="divide-y divide-olive-300">
            {selectedMembers.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-olive-100"
              >
                {member.image ? (
                  <img
                    src={member.image}
                    alt=""
                    className="size-9 shrink-0 rounded-full border border-olive-300 object-cover"
                  />
                ) : (
                  <Hashvatar
                    hash={member.email}
                    mode="dither"
                    size={36}
                    className="size-9 shrink-0 rounded-full border border-olive-300"
                  />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-olive-950 text-sm">{member.name}</span>
                  <span className="truncate text-olive-500 text-xs">{member.email}</span>
                </div>
                <select
                  value={member.role}
                  onChange={(e) => changeRole(member.id, e.target.value as Role)}
                  className={cn(
                    "rounded-sm border border-olive-300 bg-olive-50 px-2 py-1 text-olive-700 text-sm",
                    "outline-none transition-[color,box-shadow]",
                    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  )}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeUser(member.id)}
                  aria-label={`Remove ${member.name}`}
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-sm text-olive-400",
                    "transition-colors hover:bg-olive-200 hover:text-orange-600",
                  )}
                >
                  <span className="icon-[ph--x-bold] size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {description && <p className="text-olive-500 text-xs">{description}</p>}
    </div>
  )
}
