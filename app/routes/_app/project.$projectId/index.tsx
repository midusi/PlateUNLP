import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import {
  type ColumnFiltersState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import clsx from "clsx"
import { Settings } from "lucide-react"
import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { Input } from "~/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { authClient } from "~/lib/auth-client"
import { formatObservation } from "~/lib/format"
import type { Breadcrumbs } from "../-components/AppBreadcrumbs"
import { getProject } from "./-actions/get-project"
import { DeletePlates } from "./-components/DeletePlates"
import { UploadPlate } from "./-components/UploadPlate"

export const Route = createFileRoute("/_app/project/$projectId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const project = await getProject({ data: { projectId: params.projectId } })
    if (!project) throw notFound()

    const session = await authClient.getSession()
    const user = session.data!.user

    return {
      breadcrumbs: [
        {
          title: project.name,
          link: { to: "/project/$projectId", params: { projectId: project.id } },
        },
      ] satisfies Breadcrumbs,
      project,
      user,
    }
  },
})

type Plate = NonNullable<Awaited<ReturnType<typeof getProject>>>["plates"][number]

const columnHelper = createColumnHelper<Plate>()
const columns = [
  columnHelper.display({
    id: "select",
    enableHiding: false,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select plate"
      />
    ),
  }),
  columnHelper.accessor("PLATE-N", {
    // size: Number.MAX_SAFE_INTEGER, // Grow to fill available space
    header: "Plate",
    cell: (info) => (
      <Link to="/plate/$plateId" params={{ plateId: info.row.original.id }}>
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("observations", {
    header: "Observations",
    cell: (info) => (
      <ul className="-my-2 -mr-2 table border-l bg-muted">
        {info.getValue().map((obs, i, arr) => (
          <li key={obs.id} className="contents">
            <Link
              to="/observation/$observationId"
              params={{ observationId: obs.id }}
              className={clsx(
                "table-row h-10 w-full bg-center bg-cover transition-opacity hover:opacity-80",
                i < arr.length - 1 && "border-b",
              )}
              style={{ backgroundImage: `url(/observation/${obs.id}/preview)` }}
            >
              <span
                className="table-cell h-full pr-8 pl-1 align-middle"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--color-background) 25%, 75%, transparent)`,
                }}
              >
                {formatObservation({
                  id: obs.id,
                  OBJECT: obs.OBJECT,
                  "DATE-OBS": { value: obs["DATE-OBS"], isKnown: obs["DATE-OBS?"] },
                  UT: { value: obs.UT, isKnown: obs["UT?"] },
                })}
              </span>
              <div className="table-cell w-full" />
            </Link>
          </li>
        ))}
      </ul>
    ),
  }),
]

function RouteComponent() {
  const { user, project } = Route.useLoaderData()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  const table = useReactTable({
    data: project.plates,
    columns,
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getExpandedRowModel: getExpandedRowModel(),
    defaultColumn: {
      minSize: 0,
      size: 0,
      maxSize: Number.MAX_SAFE_INTEGER,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const selectedIds = Object.entries(rowSelection)
    .filter(([_, selected]) => selected)
    .map(([id]) => id)

  return (
    <div className="w-full">
      <div className="flex flex-row gap-4">
        <h1 className="font-medium text-xl">{project.name}</h1>
        {user.role === "admin" && (
          <Link to="/project/$projectId/settings" params={{ projectId: project.id }}>
            <Settings className="baorder flex h-full items-center" size={22} strokeWidth={1} />
          </Link>
        )}
      </div>
      <div className="flex flex-row items-center py-4">
        <Input
          placeholder="Find plate..."
          value={(table.getColumn("PLATE-N")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("PLATE-N")?.setFilterValue(event.target.value)}
          className="max-w-sm bg-background"
        />
        <div className="grow" />
        {selectedIds.length > 0 ? (
          <DeletePlates plateIds={selectedIds} onDeleted={() => table.resetRowSelection()} />
        ) : (
          <UploadPlate projectId={project.id} />
        )}
      </div>
      <div className="overflow-hidden rounded-md border bg-background">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() || "auto" }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-muted-foreground text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
