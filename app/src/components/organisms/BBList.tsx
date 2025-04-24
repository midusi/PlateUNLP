import type { BBClassesProps } from "@/enums/BBClasses"
import type { BoundingBox } from "@/interfaces/BoundingBox"
import clsx from "clsx"
import { Check, ChevronDown, Edit2, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Card } from "../atoms/card"
import { BoxMetadata, BoxMetadataForm } from "../molecules/BoxMetadataForm"

interface BoxListProps {
  boundingBoxes: BoundingBox[]
  setBoundingBoxes: React.Dispatch<React.SetStateAction<BoundingBox[]>>
  selected: string | null
  setSelected: React.Dispatch<React.SetStateAction<string | null>>
  classes: BBClassesProps[]
  parameters: BBListParameters
}
interface BBListParameters {
  fieldsMetadata: boolean
}

export function BoxList({ boundingBoxes, setBoundingBoxes, selected, setSelected, classes, parameters }: BoxListProps) {
  function handleSelect(id: string) {
    if (selected === id) {
      //setSelected(null)
    }
    else {
      setSelected(id)
    }
  }

  return (
    <Card className="overflow-visible border-slate-200">
      <div className={clsx(
        "bg-slate-50 px-4 py-3 border-b border-slate-200",
        " flex items-center justify-between",
      )}
      >
        <h3 className="font-medium text-slate-900">Bounding Boxes</h3>
        <span className="text-sm text-slate-500">
          {boundingBoxes.length}
          {" "}
          boxes
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {boundingBoxes.length > 0 && (
          boundingBoxes.map(box => (
            <ItemOfBoxList
              key={box.id}
              box={box}
              setBoundingBoxes={setBoundingBoxes}
              isSelected={box.id === selected}
              onSelect={handleSelect}
              classes={classes}
              parameters={parameters}
            />
          ))
        )}
      </div>
    </Card>
  )
}

interface ItemOfBoxListProps {
  box: BoundingBox
  setBoundingBoxes: React.Dispatch<React.SetStateAction<BoundingBox[]>>
  isSelected: boolean
  onSelect: (id: string) => void
  classes: BBClassesProps[]
  onDelete?: (id: string) => void
  parameters: BBListParameters
}

const boxMetadatas: { [id: number | string]: BoxMetadata } = {}

function ItemOfBoxList({
  box,
  setBoundingBoxes,
  isSelected,
  onSelect,
  classes,
  onDelete,
  parameters
}: ItemOfBoxListProps) {
  const { id, name, class_info } = box
  const [selected, setSelected] = useState<BBClassesProps>(class_info)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  useEffect(() => {
    if (!isSelected) {
      setIsSelectOpen(false)
    }
  }, [isSelected])

  function handleInteractableClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSelected) {
      onSelect(id.toString())
    }
  };

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (onDelete) {
      onDelete(id.toString())
    }
    else {
      setBoundingBoxes(prevBoxes => prevBoxes.filter(b => b.id !== id))
    }
  }

  function handleChangeName(value: string) {
    if (name !== value) {
      setBoundingBoxes(prevBoxes => prevBoxes.map(b => (b.id === box.id ? { ...b, name: value } : b)))
    }
  }

  function handleChangeClassType(classType: BBClassesProps) {
    if (class_info.name !== classType.name) {
      setBoundingBoxes(prevBoxes =>
        prevBoxes.map(b => (b.id === box.id ? { ...b, class_info: classType } : b)),
      )
      setSelected(classType)
    }
    setIsSelectOpen(false)
  }
  const boxMetadataFormRef = useRef<{ setValues: (spectrumMetadata: BoxMetadata) => void, resetValues: () => void, getValues: () => BoxMetadata, validate: () => void }>(null)
  if (id in boxMetadatas) {
    boxMetadataFormRef.current?.setValues(boxMetadatas[id])
  }
  const handleFormChange = (data: BoxMetadata) => {
    if (Object.keys(data).length > 0) {
      boxMetadatas[id] = data
    }
    // Acá podés hacer lo que quieras con los datos del formulario
  }

  return (
    <div
      key={id}
      className={clsx(
        "flex  p-3 transition-colors cursor-pointer",
        isSelected
          ? "bg-blue-50 border-l-2 border-l-blue-500"
          : "bg-white hover:bg-slate-50 border-l-2 border-l-transparent",
      )}
      onClick={() => onSelect(id.toString())}
    >
      <div className={
        // Las 2 primeras letras del Id en un circulo por delante
        clsx(
          "flex-shrink-0 flex items-center justify-center",
          " rounded-full w-8 h-8",
          "bg-slate-100 text-slate-700 text-sm font-medium mr-3",
        )
      }
      >
        {id.toString().slice(0, 2)}
      </div>

      <div className="flex flex-col flex-grow min-w-0">
        <div className="flex items-center">
          <InputWhitTemp
            value={name}
            onEnter={handleChangeName}
            className="text-sm font-medium text-slate-900 w-full"
            onClick={handleInteractableClick}
          />
          <Edit2 className="w-3 h-3 text-slate-400 ml-1" />
        </div>



        <div className="flex items-center mt-1 text-xs text-slate-500">
          <span className="mr-2">
            W:
            {Math.round(box.width)}
            px
          </span>
          <span>
            H:
            {Math.round(box.height)}
            px
          </span>

        </div>
        {isSelected && (
          <hr />
        )}
        <div>
          {isSelected && (
            <BoxMetadataForm ref={boxMetadataFormRef} onChange={handleFormChange} />
          )}
        </div>
      </div>

      <div className="flex ml-2 space-x-3">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              if (!isSelected && !isSelectOpen) {
                setIsSelectOpen(true)
              }
              else if (isSelected && !isSelectOpen) {
                e.stopPropagation()
                setIsSelectOpen(true)
              }
              else if (!isSelected && isSelectOpen) {
                e.stopPropagation()
                setIsSelectOpen(false)
              }
              else if (isSelected && isSelectOpen) {
                e.stopPropagation()
                setIsSelectOpen(false)
              }
            }}
            className={clsx(
              "flex items-center gap-2 px-2 py-1.5 text-sm rounded border",
              isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-slate-200 hover:bg-slate-50",
            )}
          >
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: selected.color }} />
            <span className="max-w-[100px] truncate">{selected.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {isSelectOpen && (
            <div className="absolute z-10 mt-1 right-0 w-48 bg-white border border-slate-200 rounded-md shadow-lg">
              <div className="py-1 max-h-60 overflow-auto">
                {classes.map(classType => (
                  <button
                    type="button"
                    key={classType.name}
                    className={clsx(
                      "flex items-center w-full px-3 py-2 text-sm text-left",
                      selected.name === classType.name
                        ? "bg-blue-50 text-blue-700"
                        : "hover:bg-slate-50",
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleChangeClassType(classType)
                    }}
                  >
                    <span className="w-4 h-4 mr-2 rounded-sm" style={{ backgroundColor: classType.color }} />
                    <span className="flex-grow">{classType.name}</span>
                    {selected.name === classType.name && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  )
}

interface InputWhitTempProps {
  value: string
  onEnter: (value: string) => void
  className: string
  onClick: (e: React.MouseEvent) => void
}



function InputWhitTemp({ value, onEnter, className, onClick }: InputWhitTempProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [temp, setTemp] = useState<string>(value || "Unnamed box")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setIsEditing(false)
      onEnter(temp)
    }
    else if (e.key === "Escape") {
      setIsEditing(false)
      setTemp(value || "Unnamed box")
    }
  }

  return isEditing
    ? (
      <input
        ref={inputRef}
        className={clsx(
          "bg-white border border-blue-300",
          "rounded px-2 py-1 outline-none",
          "focus:ring-2 focus:ring-blue-200",
          className,
        )}
        value={temp}
        onChange={e => setTemp(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setIsEditing(false)
          onEnter(temp)
        }}
      />
    )
    : (
      <div
        className={clsx("cursor-text", className)}
        onClick={(e) => {
          setIsEditing(true)
          onClick(e)
        }}
      >
        {temp}
      </div>
    )
}
