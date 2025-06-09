import { BoundingBox } from "@/interfaces/BoundingBox"
import { Dispatch, SetStateAction } from "react"

/**
 * Listado de props que espera recibir BoundingBoxer
 * @interface BoundingBoxer
 */
interface BoundingBoxerProps {
    /** 
     * Imagen a mostrar codificada en base64. Si no hay imagen entonces no 
     * enviar en este caso el componente muestra un receptor de archivos para 
     * que el usuario ingrese la imagen a usar.
     */
    file?: string
    /** 
     * Funcion para guardar permanentemente la imagen a mostrar codificada en base64. 
     * Solo es necesaria en caso de que no se provea imagen.
     */
    setFile?: (src:string) => void
    /** 
     * Listado de Cajas delimitadoras. Es necesario recibirlo para contemplar
     * el caso en el que ya se dispone de informacion sobre cajas desplegadas
     * sobre la imagen.
     */
    boundingBoxes: BoundingBox[]
    /** 
     * Funcion para modificar listado de Cajas delimitadoras. 
     * Ya sea por que se quiere modificar la cantidad o las caracteristicas
     * de las cajas
     */
    setBoundingBoxes: Dispatch<SetStateAction<BoundingBox[]>>
    /** 
     * Funcion que dada una imagen base64 detecta las posiciones de cajas
     * delimitadoras enlazadas a un objeto concreto y las retorna.
     * Puede no definirse si se quiere que la deteccion sea 100% manual.
     */
    detectBBFunction?: (img_src: string) => Promise<BoundingBox[]>
}

/**
 * Retorna un componente que realiza segmentacion de imagenes.
 */
export function BoundingBoxer({file, setFile, boundingBoxes, setBoundingBoxes, detectBBFunction}: BoundingBoxerProps){
    return <div>
        Interfaz visual de edicion
    </div>
}