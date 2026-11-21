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
  type CircleState,
  getProjectPlatesStatus,
  type PlateStatus,
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
            plateMetadata: "empty" as CircleState,
            observations: [],
            sortRank: 0,
          },
        })),
      },
      user,
    }
  },
})

type Plate = NonNullable<Awaited<ReturnType<typeof getProject>>>["plates"][number] & {
  processingStatus: PlateStatus
}

type CircleProps =
  | {
      state: CircleState
      label: string
      to: string
      params: Record<string, string>
      /** Si se informa, el círculo no navega y muestra este texto como motivo. */
      disabledReason?: string
    }
  | { state: "done"; label: string; to?: undefined }

const circleClasses: Record<CircleState, string> = {
  empty: "border-2 border-muted-foreground/30 bg-background text-muted-foreground/50",
  partial: "border-2 border-yellow-400 bg-yellow-100 text-yellow-700",
  done: "border-2 border-green-600 bg-green-100 text-green-700",
}

function StatusCircle(props: CircleProps) {
  const base = clsx(
    "inline-flex size-7 items-center justify-center rounded-full font-bold text-[10px] leading-none transition",
    circleClasses[props.state],
  )

  if (!props.to) {
    return (
      <span className={base} role="img" aria-label={props.label} title={props.label}>
        ✓
      </span>
    )
  }

  if (props.disabledReason) {
    return (
      <span
        className={clsx(base, "cursor-not-allowed opacity-40")}
        role="img"
        aria-label={`${props.label}: ${props.disabledReason}`}
        title={props.disabledReason}
      >
        {props.label}
      </span>
    )
  }

  return (
    <Link
      to={props.to}
      params={props.params}
      className={clsx(
        base,
        "cursor-pointer hover:scale-110 hover:shadow-md hover:ring-2 hover:ring-primary/40",
      )}
      aria-label={props.label}
      title={props.label}
    >
      {props.label}
    </Link>
  )
}

function PlateStatusIndicators({
  status,
  plateId,
  observations,
}: {
  status: PlateStatus
  plateId: string
  observations: Plate["observations"]
}) {
  const obsById = new Map(observations.map((o) => [o.id, o]))

  return (
    <div className="flex flex-col gap-1">
      {status.observations.length === 0 ? (
        // Sin observaciones: solo el círculo P
        <div className="flex items-center gap-1.5">
          <StatusCircle
            state={status.plateMetadata}
            label="P"
            to="/plate/$plateId"
            params={{ plateId }}
          />
        </div>
      ) : (
        status.observations.map((obs) => {
          const obsData = obsById.get(obs.id)
          const allDone =
            status.plateMetadata === "done" &&
            obs.metadata === "done" &&
            obs.extraction === "done" &&
            obs.calibration === "done"

          return (
            <div key={obs.id} className="flex items-center gap-1.5">
              {/* P — metadatos de la placa, igual en todas las filas */}
              <StatusCircle
                state={status.plateMetadata}
                label="P"
                to="/plate/$plateId"
                params={{ plateId }}
              />

              {/* O — metadatos de la observación */}
              <StatusCircle
                state={obs.metadata}
                label="O"
                to="/observation/$observationId"
                params={{ observationId: obs.id }}
              />

              {/* E — detección y extracción */}
              <StatusCircle
                state={obs.extraction}
                label="E"
                to="/observation/$observationId"
                params={{ observationId: obs.id }}
              />

              {/* C — calibración */}
              <StatusCircle
                state={obs.calibration}
                label="C"
                to="/observation/$observationId/calibrate"
                params={{ observationId: obs.id }}
                disabledReason={
                  obs.extraction === "done" ? undefined : "Available once extraction is done"
                }
              />

              {/* ✓ — completo */}
              {allDone && (
                <StatusCircle
                  state="done"
                  label={`${obsData ? formatObservation({ name: obsData["OBS-N"], OBJECT: obsData.OBJECT }) : obs.obsN} completada`}
                />
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

type StatusFilterValue =
  | "all"
  | "plate-metadata"
  | "observation-metadata"
  | "extraction"
  | "calibration"
  | "completed"

const statusFilterOptions: Array<{ value: StatusFilterValue; label: string }> = [
  { value: "all", label: "All states" },
  { value: "plate-metadata", label: "Plate metadata" },
  { value: "observation-metadata", label: "Observation metadata" },
  { value: "extraction", label: "Spectrum / Extraction" },
  { value: "calibration", label: "Calibration" },
  { value: "completed", label: "Completed" },
]

/**
 * Cada filtro mira solo su propia etapa, igual que el círculo con esa letra: una placa con la
 * extracción pendiente aparece en "Spectrum / Extraction" aunque otras etapas también lo estén.
 */
function matchesStatusFilter(status: PlateStatus, filter: StatusFilterValue): boolean {
  const { plateMetadata, observations } = status

  switch (filter) {
    case "all":
      return true
    case "plate-metadata":
      return plateMetadata !== "done"
    case "observation-metadata":
      return observations.some((o) => o.metadata !== "done")
    case "extraction":
      return observations.some((o) => o.extraction !== "done")
    case "calibration":
      return observations.some((o) => o.calibration !== "done")
    case "completed":
      return (
        plateMetadata === "done" &&
        observations.length > 0 &&
        observations.every(
          (o) => o.metadata === "done" && o.extraction === "done" && o.calibration === "done",
        )
      )
  }
}

const columnWidthById: Record<string, string> = {
  delete: "44px",
  select: "44px",
  "PLATE-N": "23%",
  observations: "50%",
  status: "20%",
}

const columnHelper = createColumnHelper<Plate>()
const columns = [
  columnHelper.display({
    id: "delete",
    size: 44,
    enableSorting: false,
    header: () => <span className="sr-only">Delete</span>,
    cell: ({ row }) => <DeletePlates plateIds={[row.original.id]} iconOnly />,
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
                {formatObservation({ name: obs["OBS-N"], OBJECT: obs.OBJECT })}
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

      if (a.sortRank !== b.sortRank) return a.sortRank - b.sortRank
      return rowA.original["PLATE-N"].localeCompare(rowB.original["PLATE-N"])
    },
    filterFn: (row, columnId, filterValue: StatusFilterValue) => {
      const status = row.getValue<PlateStatus>(columnId)
      return matchesStatusFilter(status, filterValue)
    },
    cell: (info) => {
      const status = info.getValue()

      return (
        <PlateStatusIndicators
          status={status}
          plateId={info.row.original.id}
          observations={info.row.original.observations}
        />
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
          value={
            ((table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all") as string
          }
          onChange={(event) =>
            table.getColumn("status")?.setFilterValue(event.target.value as StatusFilterValue)
          }
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
                    <TableHead
                      key={header.id}
                      style={{ width: width ?? (header.getSize() || "auto") }}
                    >
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
