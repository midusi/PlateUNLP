import type { BBClassesProps } from "@/enums/BBClasses"
import type { BoundingBox } from "@/interfaces/BoundingBox"
import type { Dispatch, SetStateAction } from "react"
import { cropImages } from "@/lib/cropImage"
import clsx from "clsx"
import { Bot, Palette, RotateCw, Square, Trash2 } from "lucide-react"
import { nanoid } from "nanoid"
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react"
import { Button } from "../atoms/button"
import { Card } from "../atoms/card"
import { BoxList, Step } from "./BBList"
import { ImageLoader } from "./ImageLoader"
import { ImageViewer } from "./ImageViewer"
import { BoxMetadata } from "../molecules/BoxMetadataForm"

interface BBUIProps {
  file?: string | null
  boundingBoxes: BoundingBox[]
  setBoundingBoxes: Dispatch<SetStateAction<BoundingBox[]>>
  boxMetadatas: BoxMetadata[]
  setBoxMetadatas: Dispatch<SetStateAction<BoxMetadata[]>>
  setValidForms: Dispatch<boolean>,
  onComplete: () => void
  saveBoundingBoxes: (boundingBoxes: BoundingBox[], boxMetadata: BoxMetadata[]) => void
  saveImageLoading?: (src: string) => void
  classes: BBClassesProps[]
  determineBBFunction: (img_src: string) => Promise<BoundingBox[]>
  parameters: BBUIParameters
}

interface BBUIParameters {
  rotateButton: boolean
  invertColorButton: boolean
  step: Step
}

export const BBUI = forwardRef(({
  file = null,
  boundingBoxes,
  setBoundingBoxes,
  boxMetadatas,
  setBoxMetadatas,
  setValidForms,
  onComplete,
  saveBoundingBoxes,
  saveImageLoading,
  classes,
  determineBBFunction,
  parameters,
}: BBUIProps, ref) => {
  const [image, setImage] = useState<null | string>(file)
  const [bgWhite, setBgWhite] = useState(true)
  const [rotation, setRotation] = useState(0)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)

  const bBListRef = useRef<{ showErrors: () => void }>(null)
  useImperativeHandle(ref, () => ({
    showErrors: () => {
      bBListRef.current?.showErrors()
    }
  }));


  const handleDeleteSelected = useCallback(() => {
    if (selectedBoxId) {
      setBoundingBoxes(prev => prev.filter(box => box.id !== selectedBoxId))
      setSelectedBoxId(null)
    }
  }, [selectedBoxId, setBoundingBoxes])

  function handleImageLoad(src: string) {
    setImage(src)
    if (saveImageLoading) {
      saveImageLoading(src)
    }
  }

  async function handleAutodetect(src: string) {
    const bbAutodetectedPromise = determineBBFunction(src)
    const newBBs: BoundingBox[] = [...boundingBoxes]
    for (const bb of await bbAutodetectedPromise) {
      const newBB = { ...bb, name: `box-${Date.now()}`, id: nanoid() }
      newBBs.push(newBB)
    }
    setBoundingBoxes(newBBs)
  }

  return (
    <>
      <Card className="overflow-hidden mb-6">
        <div className="bg-slate-100 p-2 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Tools</h2>
            <div className="flex gap-2">
              {image && (
                <Button
                  onClick={() => { handleAutodetect(image) }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-black bg-white hover:bg-slate-50"
                >
                  <Bot className="h-4 w-4" />
                  <span>
                    Autodetect Bounding Boxes
                  </span>
                </Button>
              )}
              {parameters.rotateButton && (
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
              )}

              {parameters.invertColorButton
                && (
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
                )}
              <Button
                onClick={() => {
                  setIsDrawingMode(!isDrawingMode)
                  // setSelectedBoxId(null)
                }}
                variant="outline"
                size="sm"
                className={clsx(
                  "flex items-center gap-2",
                  isDrawingMode
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-white text-black hover:bg-slate-50",
                )}
              >
                <Square className="h-4 w-4" />
                <span>{isDrawingMode ? "Cancel Drawing" : "Draw Box"}</span>
              </Button>
              {selectedBoxId && (
                <Button
                  onClick={handleDeleteSelected}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Box</span>
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className={clsx(
          "w-full h-[300px]",
          "flex items-center justify-center",
          " bg-slate-50 overflow-hidden",
        )}
        >
          {image
            ? (
              <ImageViewer
                src={image}
                rotation={rotation}
                bgWhite={bgWhite}
                isDrawingMode={isDrawingMode}
                setIsDrawingMode={setIsDrawingMode}
                selectedBoxId={selectedBoxId}
                setSelectedBoxId={setSelectedBoxId}
                boundingBoxes={boundingBoxes}
                setBoundingBoxes={setBoundingBoxes}
                boxMetadatas={boxMetadatas}
                setBoxMetadatas={setBoxMetadatas}
              />
            )
            : <ImageLoader handleImageLoad={handleImageLoad} />}
        </div>
      </Card>
      <BoxList
        ref={bBListRef}
        boundingBoxes={boundingBoxes}
        setBoundingBoxes={setBoundingBoxes}
        boxMetadatas={boxMetadatas}
        setBoxMetadatas={setBoxMetadatas}
        setValidForms={setValidForms}
        selected={selectedBoxId}
        setSelected={setSelectedBoxId}
        classes={classes}
        parameters={{ step: parameters.step }}
      />
      <div className="flex justify-center pt-4">
        <Button
          onClick={() => {
            // console.log("BB: ", boundingBoxes)
            // cropImages(image!, boundingBoxes).then((srcs) => {
            //   for (let i = 0; i < srcs.length; i++) {
            //     const a = document.createElement("a")
            //     a.href = srcs[i]
            //     a.download = "imagen.png"
            //     a.click()
            //   }
            // })

            saveBoundingBoxes(boundingBoxes, boxMetadatas)
            onComplete()
          }}
          disabled={image === null || boundingBoxes.length === 0}
        >
          Save
        </Button>
      </div>
    </>
  )
})
