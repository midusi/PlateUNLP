import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { Hashvatar } from "hashvatar/react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { breadcrumb } from "~/lib/breadcrumbs"
import { notifyError, notifySucces } from "~/lib/notifications"
import { getSession } from "../-actions/get-session"
import { listUsers, listUsersQueryOptions } from "./-actions/list-users"
import { setUserRole } from "./-actions/set-role"
import { CreateUserModal } from "./-components/CreateUserModal"
import { DeleteUserDialog } from "./-components/DeleteUserDialog"
import { ResetPasswordDialog } from "./-components/ResetPasswordDialog"

export const Route = createFileRoute("/_app/admin/")({
  component: RouteComponent,
  loader: async () => {
    const session = await getSession()
    if (session?.user.role !== "admin") {
      throw redirect({ to: "/projects" })
    }
    const users = await listUsers()
    return {
      breadcrumbs: [breadcrumb({ title: "Admin", to: "/admin" })],
      currentUserId: session.user.id,
      users,
    }
  },
})

function RouteComponent() {
  const { currentUserId, users: initialUsers } = Route.useLoaderData()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null)

  const queryClient = useQueryClient()
  const { data: users } = useQuery({
    ...listUsersQueryOptions(),
    initialData: { users: initialUsers.users, total: initialUsers.total },
  })

  const { mutate: changeRole } = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "user" }) => {
      await setUserRole({ data: { userId, role } })
    },
    onSuccess: () => {
      notifySucces("Role updated")
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: (error) => {
      notifyError("Failed to update role", error)
    },
  })

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl text-olive-950 tracking-tight">User Management</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <span className="icon-[ph--plus-bold] size-4" />
          Create User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.users.map((user) => {
                const isSelf = user.id === currentUserId
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="size-8 rounded-full border border-olive-300 bg-olive-100 object-cover"
                          />
                        ) : (
                          <Hashvatar
                            hash={user.email}
                            mode="dither"
                            size={32}
                            className="size-8 rounded-full border border-olive-300"
                          />
                        )}
                        <span className="font-medium text-olive-950">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-olive-500">{user.username || "—"}</TableCell>
                    <TableCell className="text-olive-500">{user.email}</TableCell>
                    <TableCell>
                      <select
                        value={user.role}
                        disabled={isSelf}
                        onChange={(e) =>
                          changeRole({
                            userId: user.id,
                            role: e.target.value as "admin" | "user",
                          })
                        }
                        className="rounded-sm border border-olive-300 bg-olive-50 px-2 py-1 text-olive-700 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-olive-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setResetTarget({ id: user.id, name: user.name })}
                        className="text-olive-400 hover:text-orange-600"
                      >
                        <span className="icon-[ph--key-bold] size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isSelf}
                        onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                        className="text-olive-400 hover:text-red-600"
                      >
                        <span className="icon-[ph--trash-bold] size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isCreateOpen && <CreateUserModal onClose={() => setCreateOpen(false)} />}

      {deleteTarget && (
        <DeleteUserDialog
          userId={deleteTarget.id}
          userName={deleteTarget.name}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
        />
      )}

      {resetTarget && (
        <ResetPasswordDialog
          userId={resetTarget.id}
          userName={resetTarget.name}
          open={!!resetTarget}
          onOpenChange={(open) => {
            if (!open) setResetTarget(null)
          }}
        />
      )}
    </div>
  )
}
