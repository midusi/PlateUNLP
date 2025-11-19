import { useNavigate } from "@tanstack/react-router"
import { decode, encodeDataURL, type Image } from "image-js"
import { useMemo, useRef, useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { SUPPORTED_PLATE_MIMETYPES } from "~/consts"
import { notifyError } from "~/lib/notifications"
import { uploadPlate } from "../-actions/upload-plate"

export function UploadPlate({ projectId }: { projectId: string }) {
  const navigate = useNavigate()

  const [state, setState] = useState<"idle" | "reading" | "preview" | "uploading">("idle")

  const [image, setImage] = useState<Image>()
  const [filename, setFilename] = useState<string>("")
  const [rotate, setRotate] = useState(0)

  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUrl = useMemo(() => (image ? encodeDataURL(image) : undefined), [image])

  return (
    <form
      ref={formRef}
      className="contents"
      onSubmit={async (e) => {
        setState("uploading")
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        const result = await uploadPlate({ data })
        if (result.success) {
          navigate({
            to: "/plate/$plateId",
            params: { plateId: result.plateId },
          })
        } else {
          notifyError(result.error)
          setState("preview")
        }
      }}
    >
      <input
        className="hidden"
        name="plate"
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_PLATE_MIMETYPES.join(", ")}
        multiple={false}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return

          if (!SUPPORTED_PLATE_MIMETYPES.includes(file.type)) {
            notifyError(`Unsupported file type: ${file.type}`)
            return
          }

          setState("reading")

          const data = await file.arrayBuffer()
          let img = decode(new Uint8Array(data))
          img = img.resize({ width: 400 })

          setRotate(0)
          setImage(img)
          setFilename(file.name)
          setState("preview")
        }}
      />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="rotate" value={rotate} />

      <Button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={state === "reading"}
      >
        {state === "reading" ? (
          <>
            <span className="icon-[ph--spinner-bold] animate-spin" /> Opening...
          </>
        ) : (
          <>
            <span className="icon-[ph--upload-simple-bold]" /> Upload plate
          </>
        )}
      </Button>

      <Dialog
        open={state === "preview" || state === "uploading"}
        onOpenChange={() => setState("idle")}
      >
        <DialogContent className="sm:max-w-[425px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Upload plate</DialogTitle>
            <DialogDescription>
              Before uploading the plate, make sure that the observations are mostly{" "}
              <strong>horizontal</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="-mb-2 flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={state === "uploading"}
              onClick={() => {
                setRotate((prev) => prev - 90)
                setImage(image!.rotate(-90))
              }}
            >
              <span className="icon-[ph--arrow-counter-clockwise-bold]" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={state === "uploading"}
              onClick={() => {
                setRotate((prev) => prev + 90)
                setImage(image!.rotate(90))
              }}
            >
              <span className="icon-[ph--arrow-clockwise-bold]" />
            </Button>
          </div>

          <figure className="rounded-lg border bg-accent p-2">
            <img src={imageUrl} alt={filename} className="mx-auto max-h-40 max-w-full" />
            <figcaption className="mt-4 text-center text-xs">{filename}</figcaption>
          </figure>

          <DialogFooter>
            <DialogClose disabled={state === "uploading"} render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={state === "uploading"}
            >
              {state === "uploading" ? (
                <>
                  <span className="icon-[ph--spinner-bold] animate-spin" /> Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
