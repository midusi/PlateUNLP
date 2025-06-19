import clsx from "clsx"
import { Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { BBClassesProps } from "@/enums/BBClasses"
import type { BoundingBox } from "@/interfaces/BoundingBox"
import { Card } from "../atoms/card"
import React from "react"
import { SelectorBBClass } from "../atoms/SelectorBBClass"

/** 
 * Interfaz del componente BoxList 
 * @interface BoxList
 */
interface BoxListProps {
  /** 
   * Componente hijo que se va aclonar en cada elemento del listado.
   * Debe aceptar como parametro el id de la caja delimitadora que le
   * corresponde.
   */
  children?: React.ReactElement<{ boxId: string }>
  /** Listado de cajas delimitadoras */
  boundingBoxes: BoundingBox[]
  /** Funcion para modificar el listado de cajas delimitadoras */
  setBoundingBoxes: React.Dispatch<React.SetStateAction<BoundingBox[]>>
  /** Indicador del identificador de la caja delimitadora seleccionada */
  selected: string | null
  /** 
   * Funcion para modificar el identificador de la caja delimitadora
   * seleccionada.
  */
  setSelected: React.Dispatch<React.SetStateAction<string | null>>
  /** Listado de clases a las que pertenecen las cajas delimitadoras */
  classes: BBClassesProps[]
}

/** 
 * Componente que muestra un listado interactuable informacion de 
 * cajas delimitadoras 
 */
export function BoxList({
  children,
  boundingBoxes,
  setBoundingBoxes,
  selected,
  setSelected,
  classes
}: BoxListProps) {

  /** Manejar selección de caja delimitadora desde la lista */
  function handleSelect(id: string) {
    setSelected(id)
  }

  /** Manejar cambio del nombre de caja delimitadora 
   * @param {string} id - Identificador de la caja delimitadora a modificar.
   * @param {string} newName - Nuevo nombre.
   */
  function handleChangeName(id:string, newName: string ) {
    setBoundingBoxes((prevBoxes) =>
      prevBoxes.map((b) => (b.id === id ? { ...b, name: newName } : b)),
    )
  }

  /** 
   * Manejar borrado de caja delimitadora 
   * @param {string} id - Identificador de la caja delimitadora a borrar.
   */
  function handleDelete(id:string) {
    setBoundingBoxes((prevBoxes) => prevBoxes.filter((b) => (b.id !== id)))
    setSelected(null)
  }

  return (
    <Card className="overflow-visible border-slate-200">
      <div
        className={clsx(
          "bg-slate-50 px-4 py-3 border-b border-slate-200",
          "flex items-center justify-between",
        )}
      >
        <h3 className="font-medium text-slate-900">Bounding Boxes</h3>
        <span className="text-sm text-slate-500">
          {boundingBoxes.length} boxes
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {boundingBoxes.length > 0 &&
          boundingBoxes.map((box) => { 
            return (
              <div 
                key={'list-item:'+box.id}
                className={clsx(
                  "flex  p-3 transition-colors cursor-pointer",
                  (selected == box.id)
                    ? "bg-blue-50 border-l-2 border-l-blue-500"
                    : "bg-white hover:bg-slate-50 border-l-2 border-l-transparent",
                )}
                onClick={() => handleSelect(box.id as string)}
              >
                <div
                  id="circleWhit2DigitsOfName"
                  className={
                    clsx(
                      "flex-shrink-0 flex items-center justify-center",
                      " rounded-full w-8 h-8",
                      "bg-slate-100 text-slate-700 text-sm font-medium mr-3",
                    )
                  }
                >
                  {box.name.toString().slice(0, 2)}
                </div>
                <div id="displayForRows" className="flex flex-col flex-grow min-w-0 gap-2">
                  <div id="displayForCols" className="flex flex-row flex-grow gap-6">
                    <div id="displayForRows" className="flex flex-col flex-grow min-w-0">
                      <div id="inputForModifyName" className="flex items-center">
                        <InputWhitTemp
                          value={box.name}
                          onEnter={(value) => handleChangeName(box.id as string, value)}
                          className="text-sm font-medium text-slate-900 w-full"
                        />
                      </div>
                      <div id="displayBoundingoxShape" className="flex items-center mt-1 text-xs text-slate-500 gap-2">
                        <span> W:{Math.round(box.width)}px </span>
                        <span> H:{Math.round(box.height)}px </span>
                      </div>
                    </div>
                    <SelectorBBClass box={box} classes={classes} setBoundingBoxes={setBoundingBoxes}/>
                    <button
                      type="button"
                      onClick={() => handleDelete(box.id as string)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/** Parte variable acorde a children */}
                  {selected==box.id && <div>
                      {children && React.cloneElement(children, { boxId: box.id})}
                    </div>
                  }
                </div>
              </div>
          )})}
      </div>
    </Card>
  )
}

interface InputWhitTempProps {
  value: string
  onEnter: (value: string) => void
  className: string
  onClick?: (e: React.MouseEvent) => void
}

function InputWhitTemp({
  value,
  onEnter,
  className,
  onClick,
}: InputWhitTempProps) {
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
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setTemp(value || "Unnamed box")
    }
  }

  return isEditing ? (
    <input
      ref={inputRef}
      className={clsx(
        "bg-white border border-blue-300",
        "rounded px-2 py-1 outline-none",
        "focus:ring-2 focus:ring-blue-200",
        className,
      )}
      value={temp}
      onChange={(e) => setTemp(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        setIsEditing(false)
        onEnter(temp)
      }}
    />
  ) : (
    <div
      className={clsx("cursor-text", className)}
      onClick={(e) => {
        setIsEditing(true)
        onClick && onClick(e)
      }}
    >
      {temp}
    </div>
  )
}
