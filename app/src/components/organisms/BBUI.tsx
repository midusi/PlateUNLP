import clsx from "clsx"
import { Palette, RotateCw } from "lucide-react"
import { useState } from "react"
import { Button } from "../atoms/button"
import { Card } from "../atoms/card"

// interface BBUIProps {

// }

export function BBUI() {
  const [image, setImage] = useState<null | string> (null)
  const [bgWhite, setBgWhite] = useState(true)
  const [rotation, setRotation] = useState(0)

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="bg-slate-100 p-2 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Tools</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => { setRotation((rotation + 90) % 360) }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-black bg-white hover:bg-slate-50"
              >
                <RotateCw className="h-4 w-4" />
                <span>
                  {`Rotate 90º from ${rotation}º`}
                </span>
              </Button>
              <Button
                onClick={() => { setBgWhite(!bgWhite) }}
                variant="outline"
                size="sm"
                className={clsx(
                  "flex items-center gap-2",
                  bgWhite
                    ? "bg-white text-black hover:bg-slate-50"
                    : "bg-slate-800 text-white hover:bg-slate-700",
                )}
              >
                <Palette className="h-4 w-4" />
                <span>Invert colors</span>
              </Button>
            </div>
          </div>
        </div>
        <div className={clsx(
          "p-6 w-full h-[500px]",
          "flex items-center justify-center",
          " bg-slate-50 rounded-lg overflow-hidden",
        )}
        >
          {image
            ? <span>Imagen cargada</span>
            : (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-slate-500">
                      <span className="font-semibold">Click to upload an image</span>
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG or TIFF</p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
        </div>
      </Card>
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => { }}
          disabled
        >
          Save
        </Button>
      </div>
    </>
  )
}
