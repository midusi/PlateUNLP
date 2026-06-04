import { useMemo, useState } from "react"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { OPTIONAL_FITS_FIELDS } from "~/lib/fits-export-fields"

export type FITSExportField = {
  /** Display label shown in the warning dialog (typically the FITS keyword). */
  label: string
  /** Current value of the field. Empty string means the user has not filled it in. */
  value: string
  /**
   * Whether the user has explicitly marked the field as known. Unknown fields
   * are written as `UNKNOWN` in the FITS export and do not trigger the warning.
   * Required (non-knowable) fields should pass `true` here.
   */
  isKnown: boolean
}

type FITSExportButtonProps = {
  /** URL the browser navigates to in order to start the FITS download. */
  href: string
  /**
   * Every field that will end up in the exported FITS, including fields filled
   * on previous screens (e.g. plate metadata when exporting an observation).
   * Any entry with `isKnown=true` and an empty value triggers the warning.
   */
  fields: FITSExportField[]
  /**
   * Field labels exempt from the empty-field warning. Defaults to the notes
   * keywords ({@link OPTIONAL_FITS_FIELDS}); pass an explicit list to override.
   */
  optionalFields?: readonly string[]
  /** Button content (icon + label). */
  children: React.ReactNode
  variant?: React.ComponentProps<typeof Button>["variant"]
  className?: string
  disabled?: boolean
}

export function FITSExportButton({
  href,
  fields,
  optionalFields = OPTIONAL_FITS_FIELDS,
  children,
  variant,
  className,
  disabled,
}: FITSExportButtonProps) {
  const [warningOpen, setWarningOpen] = useState(false)

  const missingFields = useMemo(() => {
    const ignored = new Set(optionalFields)
    return fields.filter(
      (field) => field.isKnown && field.value.trim() === "" && !ignored.has(field.label),
    )
  }, [fields, optionalFields])

  function download() {
    setWarningOpen(false)
    window.location.href = href
  }

  function handleClick() {
    if (missingFields.length > 0) {
      setWarningOpen(true)
    } else {
      download()
    }
  }

  return (
    <>
      <Button onClick={handleClick} variant={variant} className={className} disabled={disabled}>
        {children}
      </Button>
      <AlertDialog open={warningOpen} onOpenChange={setWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to export?</AlertDialogTitle>
            <AlertDialogDescription>
              {missingFields.length === 1
                ? "The following field is empty and was not marked as unknown:"
                : `The following ${missingFields.length} fields are empty and were not marked as unknown:`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc rounded-md border border-olive-300 bg-olive-100 py-2 pl-8 font-mono text-olive-950 text-xs">
            {missingFields.map((field) => (
              <li key={field.label}>{field.label}</li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm">
            The exported FITS will contain blank cards for these. If they were unrecorded, consider
            marking them as <span className="font-medium">unknown</span> instead.
          </p>
          <AlertDialogFooter>
            <AlertDialogClose>Cancel</AlertDialogClose>
            <Button onClick={download}>Export anyway</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
