import { BBClassesProps } from "@/enums/BBClasses"
import { BoundingBox } from "@/interfaces/BoundingBox"
import clsx from "clsx"
import { Check, ChevronDown } from "lucide-react"
import { useState } from "react"

/**
 * Interfaz que define los parametros del componente SelectorBBClass
 * @interface SelectorBBClass
 */
interface SelectorBBClassProps {
    /** Caja delimitadora sobre la que se construye el editor */
    box: BoundingBox
    /** Clases a ofrecer como opciones */
    classes: BBClassesProps[]
    /** Funcion para modificar listado de cajas delimitadoras */
    setBoundingBoxes: React.Dispatch<React.SetStateAction<BoundingBox[]>>
}

/**
 * Retorna un componente que permite la seleccion de que clase le corresponde
 * a una caja delimitadora.
 */
export function SelectorBBClass({box, classes, setBoundingBoxes}:SelectorBBClassProps){
    /** 
     * Indicador si hay que abrir o no el selector de clase de la caja 
     * delimitadora seleccionada
     */
    const [openSelector, setOpenSelector] = useState<boolean>(false)
    /** Manejador de lo que ocurre al cliquear en el boton del seletor */
    function handleClickInSelector(e:React.MouseEvent<HTMLButtonElement, MouseEvent>){
        setOpenSelector(!openSelector)
    }

    /** Informacion de la clase seleccionada */
    const [selectedClass, setSelectedClass] = useState<BBClassesProps>(box.class_info)
    /** 
     * Manejador para cuando el usuario cliquea en una opcion de clase.
     * @param {BBClassesProps} classType
    */
    function handleChangeClassType(classType: BBClassesProps) {
        if(classType!==selectedClass){
            setSelectedClass(classType)
            setBoundingBoxes((prevBoxes) =>
                prevBoxes.map((b) =>
                b.id === box.id ? { ...b, class_info: classType } : b,
            ))
            setOpenSelector(false)
        }
    }

    return <div className="relative">
        <button
            id="buttonForOpenSelector"
            type="button"
            onClick={handleClickInSelector}
            className={clsx(
                "flex items-center gap-2 px-2 py-1.5 text-sm rounded border",
                "bg-blue-50 border-blue-200"
            )}
        >
            <span
                id="boxOfIdentifyColor"
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: selectedClass.color }}
            />
                <span id="NameOfTheActualClass" className="max-w-[100px] truncate">{selectedClass.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>

        {openSelector && (
            <div className="absolute z-10 mt-1 right-0 w-48 bg-white border border-slate-200 rounded-md shadow-lg">
            <div className="py-1 max-h-60 overflow-auto">
                {classes.map((classType) => (
                    <button
                        type="button"
                        key={classType.name}
                        className={clsx(
                            "flex items-center w-full px-3 py-2 text-sm text-left",
                            selectedClass.name === classType.name
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-slate-50",
                        )}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleChangeClassType(classType)
                        }}
                    >
                        <span
                        className="w-4 h-4 mr-2 rounded-sm"
                        style={{ backgroundColor: classType.color }}
                        />
                        <span className="flex-grow">{classType.name}</span>
                        {selectedClass.name === classType.name && (
                        <Check className="w-4 h-4 text-blue-600" />
                        )}
                    </button>
                ))}
            </div>
            </div>
        )}
    </div>
}