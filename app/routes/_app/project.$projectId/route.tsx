import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import {
  type ColumnFiltersState,
  createColumnHelper,
  type ExpandedState,
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
import type { Breadcrumbs } from "../-components/AppBreadcrumbs"
import { getProject } from "./-actions/get-project"
import { DeletePlates } from "./-components/DeletePlates"
import { UploadPlate } from "./-components/UploadPlate"

export const Route = createFileRoute("/_app/project/$projectId")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const project = await getProject({ data: { projectId: params.projectId } })
    if (!project) throw notFound()

    return {
      breadcrumbs: [
        {
          title: project.name,
          link: { to: "/project/$projectId", params: { projectId: project.id } },
        },
      ] satisfies Breadcrumbs,
      project,
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
    size: Number.MAX_SAFE_INTEGER, // Grow to fill available space
    header: "Plate",
    cell: (info) => (
      <Link to="/plate/$plateId" params={{ plateId: info.row.original.id }}>
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.display({
    id: "expander",
    header: () => null,
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <Button variant="ghost" size="sm" onClick={row.getToggleExpandedHandler()}>
          <span className="inline-block w-3 text-right">{row.getIsExpanded() ? "▼" : "▶"}</span>
        </Button>
      ) : null,
  }),
]

function RouteComponent() {
  const { project } = Route.useLoaderData()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data: project.plates,
    columns,
    getRowId: (row) => row.id,
    getSubRows: (row) =>
      row.observations.map((obs) => ({
        id: obs.id,
        "PLATE-N": obs.id,
        observations: [],
        object: obs.OBJECT,
      })) as Plate[],
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
      expanded: expanded,
    },
    onExpandedChange: setExpanded,
  })

  const selectedIds = Object.entries(rowSelection)
    .filter(([_, selected]) => selected)
    .map(([id]) => id)

  return (
    <div className="w-full">
      <h1 className="font-medium text-xl">{project.name}</h1>
      <div className="flex items-center py-4">
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={row.depth > 0 ? "bg-muted/50" : ""}
                >
                  {row.depth === 0 ? (
                    row
                      .getVisibleCells()
                      .map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))
                  ) : (
                    <>
                      <TableCell colSpan={1} className="text-right font-semibold">
                        <span className="icon-[ph--arrow-bend-down-right] h-5 w-5 text-right" />
                      </TableCell>
                      <TableCell colSpan={columns.length - 1} className="italic">
                        <Link
                          to="/observation/$observationId"
                          params={{ observationId: row.original.id }}
                        >
                          {`${row.original["PLATE-N"]}`}
                        </Link>
                      </TableCell>
                    </>
                  )}
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
