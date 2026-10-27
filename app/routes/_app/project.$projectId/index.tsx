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
import { breadcrumb } from "~/lib/breadcrumbs"
import { formatObservation } from "~/lib/format"
import { getSession } from "../-actions/get-session"
import { getProject } from "./-actions/get-project"
import {
  getProjectPlatesStatus,
  type PlateProcessingStatus,
  type PlateProcessingStatusKey,
} from "./-actions/get-project-plates-status"
import { DeletePlates } from "./-components/DeletePlates"
import { UploadPlate } from "./-components/UploadPlate"

export const Route = createFileRoute("/_app/project/$projectId/")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const [project, platesStatus] = await Promise.all([
      getProject({ data: { projectId: params.projectId } }),
      getProjectPlatesStatus({ data: { projectId: params.projectId } }),
    ])
    if (!project) throw notFound()

    const session = await getSession()
    const user = session!.user

    const statusByPlateId = new Map(platesStatus.map((s) => [s.plateId, s]))

    return {
      breadcrumbs: [
        breadcrumb({
          title: project.name,
          to: "/project/$projectId",
          params: { projectId: project.id },
        }),
      ],
      project: {
        ...project,
        plates: project.plates.map((plate) => ({
          ...plate,
          processingStatus: statusByPlateId.get(plate.id) ?? {
            plateId: plate.id,
            statusKey: "plate-metadata",
            statusLabel: "Plate metadata",
            statusRank: 0,
            stageProgress: 0,
            overallProgress: 0,
            continueTarget: { type: "plate", plateId: plate.id },
          },
        })),
      },
      user,
    }
  },
})

type Plate = NonNullable<Awaited<ReturnType<typeof getProject>>>["plates"][number] & {
  processingStatus: PlateProcessingStatus
}

const statusColorByKey: Record<PlateProcessingStatusKey, string> = {
  "plate-metadata": "bg-white border-olive-500",
  "observation-metadata": "bg-yellow-300 border-yellow-500",
  "spectrum-detection": "bg-amber-400 border-amber-600",
  "signal-extraction": "bg-orange-500 border-orange-700",
  calibration: "bg-lime-500 border-lime-700",
  completed: "bg-green-600 border-green-800",
}

const statusFilterOptions: Array<{ value: PlateProcessingStatusKey | "all"; label: string }> =
  [
    { value: "all", label: "All states" },
    { value: "plate-metadata", label: "Plate metadata" },
    { value: "observation-metadata", label: "Observation metadata" },
    { value: "spectrum-detection", label: "Spectrum detection" },
    { value: "signal-extraction", label: "Signal extraction" },
    { value: "calibration", label: "Calibration" },
    { value: "completed", label: "Completed" },
  ]

const columnWidthById: Record<string, string> = {
  delete: "44px",
  select: "44px",
  "PLATE-N": "23%",
  observations: "50%",
  status: "20%",
  continue: "72px",
}

const columnHelper = createColumnHelper<Plate>()
const columns = [
  columnHelper.display({
    id: "delete",
    size: 44,
    enableSorting: false,
    header: () => <span className="sr-only">Delete</span>,
    cell: ({ row }) => (
      <DeletePlates plateIds={[row.original.id]} iconOnly />
    ),
  }),
  columnHelper.display({
    id: "select",
    size: 44,
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
    size: 260,
    header: "Plate",
    cell: (info) => (
      <Link to="/plate/$plateId" params={{ plateId: info.row.original.id }}>
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("observations", {
    size: 560,
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
              style={{ backgroundImage: `url(/api/observation/${obs.id}/preview)` }}
            >
              <span
                className="table-cell h-full pr-8 pl-1 align-middle"
                style={{
                  backgroundImage: `linear-gradient(to right, var(--color-background) 25%, 75%, transparent)`,
                }}
              >
                {formatObservation({ "name": obs["OBS-N"], OBJECT: obs.OBJECT })}
              </span>
              <div className="table-cell w-full" />
            </Link>
          </li>
        ))}
      </ul>
    ),
  }),
  columnHelper.accessor("processingStatus", {
    id: "status",
    size: 280,
    header: "Status",
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.processingStatus
      const b = rowB.original.processingStatus

      if (a.statusRank !== b.statusRank) return a.statusRank - b.statusRank
      if (a.stageProgress !== b.stageProgress) return b.stageProgress - a.stageProgress

      return rowA.original["PLATE-N"].localeCompare(rowB.original["PLATE-N"])
    },
    filterFn: (row, columnId, filterValue: PlateProcessingStatusKey | "all") => {
      if (!filterValue || filterValue === "all") return true

      const status = row.getValue<PlateProcessingStatus>(columnId)
      return status.statusKey === filterValue
    },
    cell: (info) => {
      const status = info.getValue()

      return (
        <div className="min-w-0 max-w-full">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-sm">{status.statusLabel}</span>
            <span className="text-muted-foreground text-xs">({status.stageProgress}%)</span>
            <span className="sr-only">Status {status.statusLabel} with progress {status.stageProgress}%</span>
          </div>
          <div className="mt-1 h-1.5 w-full max-w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full"
              style={{
                width: `${Math.max(0, Math.min(100, status.stageProgress))}%`,
                backgroundImage:
                  "linear-gradient(to right, rgb(255 255 255), rgb(253 224 71), rgb(251 146 60), rgb(22 163 74))",
              }}
            />
          </div>
        </div>
      )
    },
  }),
  columnHelper.display({
    id: "continue",
    size: 72,
    enableSorting: false,
    header: "Go",
    cell: ({ row }) => {
      const status = row.original.processingStatus

      if (!status.continueTarget) {
        return (
          <span className="inline-flex size-8 items-center justify-center text-muted-foreground/40">
            <span className="icon-[ph--check-circle] size-5" aria-hidden="true" />
            <span className="sr-only">Completed</span>
          </span>
        )
      }

      if (status.continueTarget.type === "plate") {
        return (
          <Link
            to="/plate/$plateId"
            params={{ plateId: status.continueTarget.plateId }}
            className="inline-flex size-8 items-center justify-center rounded-sm border border-olive-300 text-foreground transition-colors hover:bg-muted"
            aria-label="Continue processing plate"
            title="Continue"
          >
            <span className="icon-[ph--arrow-square-out-bold] size-4" aria-hidden="true" />
          </Link>
        )
      }

      if (status.continueTarget.type === "calibration") {
        return (
          <Link
            to="/observation/$observationId/calibrate"
            params={{ observationId: status.continueTarget.observationId }}
            className="inline-flex size-8 items-center justify-center rounded-sm border border-olive-300 text-foreground transition-colors hover:bg-muted"
            aria-label="Continue calibration"
            title="Continue"
          >
            <span className="icon-[ph--arrow-square-out-bold] size-4" aria-hidden="true" />
          </Link>
        )
      }

      return (
        <Link
          to="/observation/$observationId"
          params={{ observationId: status.continueTarget.observationId }}
          className="inline-flex size-8 items-center justify-center rounded-sm border border-olive-300 text-foreground transition-colors hover:bg-muted"
          aria-label="Continue observation"
          title="Continue"
        >
          <span className="icon-[ph--arrow-square-out-bold] size-4" aria-hidden="true" />
        </Link>
      )
    },
  }),
]

function RouteComponent() {
  const { user, project } = Route.useLoaderData()

  const [sorting, setSorting] = useState<SortingState>([{ id: "status", desc: false }])
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
      <div className="flex flex-row items-center gap-4">
        <h1 className="font-bold text-olive-950 text-xl tracking-tight">{project.name}</h1>
        {user.role === "admin" && (
          <Link to="/project/$projectId/settings" params={{ projectId: project.id }}>
            <span className="icon-[ph--gear] size-5" />
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
        <label htmlFor="status-filter" className="sr-only">
          Filter by processing status
        </label>
        <select
          id="status-filter"
          value={((table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all") as string}
          onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value)}
          className="ml-2 h-9 rounded-sm border border-olive-300 bg-olive-100 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label="Filter by status"
        >
          {statusFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="grow" />
        {selectedIds.length > 0 ? (
          <DeletePlates plateIds={selectedIds} onDeleted={() => table.resetRowSelection()} />
        ) : (
          <UploadPlate projectId={project.id} />
        )}
      </div>
      <div className="overflow-hidden rounded-sm border border-olive-300 bg-background">
        <Table className="table-fixed">
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const width = columnWidthById[header.column.id]

                  return (
                    <TableHead key={header.id} style={{ width: width ?? (header.getSize() || "auto") }}>
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
                    <TableCell key={cell.id} style={{ width: columnWidthById[cell.column.id] }}>
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
