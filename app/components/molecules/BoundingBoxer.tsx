import clsx from "clsx"
import { Bot, Palette, RotateCw, Square, Trash2 } from "lucide-react"
import { round } from "mathjs"
import { nanoid } from "nanoid"
import {
  createRef,
  type Dispatch,
  ReactNode,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react"
import Moveable, { type OnDrag, type OnResize } from "react-moveable"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"
import { loadImage } from "~/lib/image"
import type { BBClassesProps } from "~/types/BBClasses"
import type { BoundingBox } from "~/types/BoundingBox"
import { Button } from "../atoms/button"
import { Card } from "../atoms/card"
import { ImageLoader } from "../organisms/ImageLoader"

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
  setFile?: (src: string) => void
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
  /** Identificador de la caja delimitadora seleccionada a cada momento */
  boundingBoxSelected: string | null
  /**
   * Funcion para modificar el la caja delimitadora que se considera
   * seleccionada a cada momento.
   * La funcion espera recibir el id de la caja a marcar como
   * seleccionada.
   */
  setBoundingBoxSelected: Dispatch<SetStateAction<string | null>>
  /**
   * Funcion que dada una imagen base64 detecta las posiciones de cajas
   * delimitadoras enlazadas a un objeto concreto y las retorna.
   * Puede no definirse si se quiere que la deteccion sea 100% manual.
   */
  detectBBFunction?: (img_src: string) => Promise<BoundingBox[]>
  /** Especificacion de si habilitar o no un listado de funcionalidades */
  enable?: {
    /** Mostrar boton de autodetección de cajas delimitadoras*/
    autodetecButton: boolean
    /** Mostrar boton de rotación */
    rotateButton: boolean
    /** Mostrar boton de inversion de colores */
    invertColorButton: boolean
    /** Mostrar boton para dibujar manualmente cajas delimitadoras */
    drawButton: boolean
  }
  /** Arreglo de clases a considerar para las cajas delimitadoras */
  classes: BBClassesProps[]
}

/**
 * Retorna un componente que realiza segmentacion de imagenes.
 */
export function BoundingBoxer({
  file,
  setFile,
  boundingBoxes,
  setBoundingBoxes,
  boundingBoxSelected,
  setBoundingBoxSelected,
  detectBBFunction,
  enable = {
    autodetecButton: true,
    rotateButton: true,
    invertColorButton: true,
    drawButton: true,
  },
  classes,
}: BoundingBoxerProps) {
  const [rotation, setRotation] = useState<number>(0)
  const [invertColor, setInvertColor] = useState<boolean>(true)

  /**
   * Manejador para el boton Atodetect
   * @param {string} src - Imgen donde realizar la deteccion (base64).
   */
  async function handleAutodetect(src: string) {
    const bbAutodetectedPromise = detectBBFunction!(src)
    const newBBs: BoundingBox[] = [...boundingBoxes]
    for (const bb of await bbAutodetectedPromise) {
      const newBB = { ...bb, name: `box-${Date.now()}`, id: nanoid() }
      newBBs.push(newBB)
    }
    setBoundingBoxes(newBBs)
  }

  /** Manejador para el boton Rotate */
  async function handleRotate() {
    setRotation((rotation + 90) % 360)
  }

  /** Manejador para el boton Invert Color */
  async function handleInvertColor() {
    setInvertColor(!invertColor)
  }

  /**
   * Manejador para el boton Eliminar Caja Delimitadora
   * @param {string} bbId - Identificador de la caja a borrar
   */
  function handleDeleteBB(bbId: string) {
    setBoundingBoxes((prev) => prev.filter((box) => box.id !== bbId))
    setBoundingBoxSelected(null)
  }

  /**
   * Manejador para cuando el usuario elije una imagen.
   * @param {string} src - Imagen a guardar (base64)
   */
  function handleLoad(src: string) {
    setFile!(src)
  }

  /** Referencia al elemento <img> dentro que muestra la imagen. */
  const imgRef = useRef<HTMLImageElement>(null)
  /** Referencia al elemento <div> que contiene la interfaz visual. */
  const containerRef = useRef<HTMLDivElement>(null)
  /** Imagen original */
  const [originalImg, setOriginalImg] = useState<HTMLImageElement>()
  useEffect(() => {
    if (file) {
      loadImage(file).then((img) => {
        setOriginalImg(img)
      })
    }
  }, [file])
  /**
   * Manejador para el boton Agregar Caja Delimitadora.
   * Al ejecutar agrega una caja delimitadora con cordenadas
   * al centro de la imagen.
   */
  function handleAddBB() {
    /** Pixels equivalentes al 1% del ancho de la imagen original */
    const oneWidth = originalImg!.naturalWidth / 100
    /** Pixels equivalentes al 1% del alto de la imagen original */
    const oneHeight = originalImg!.naturalHeight / 100
    /** Nueva caja delimitadora */
    const bb: BoundingBox = {
      id: nanoid(),
      name: "newObject",
      x: round(oneWidth * 45),
      y: round(oneHeight * 45),
      width: round(oneWidth * 10),
      height: round(oneHeight * 10),
      class_info: classes[0],
      prob: 1,
    }
    setBoundingBoxes([...boundingBoxes, bb])
  }
  /**
   * Escala de conversion de la imagen que se esta mostrando
   * respecto a la imagen original.
   * x = imagen_mostrada / imagen_original
   * Si la imagen que se muestra es menor entonces x < 1. Si es mas
   * grande x > 1. Si son iguales x = 1
   */
  const [imgScale, setImgScale] = useState<number>(1)
  /**
   * Escala del contenedor respecto al tamaño de la imagen original.
   * x = contenedor / imagen_original
   * Si el contenedor es menor es menor entonces x < 1. Si es mas
   * grande x > 1. Si son iguales x = 1
   */
  const [containerScale, setContainerScale] = useState<number>()
  useEffect(() => {
    if (file && containerRef.current && originalImg) {
      const rectContainer = containerRef.current!.getBoundingClientRect()
      setContainerScale(rectContainer.height / originalImg.naturalHeight)
    }
  }, [file, containerRef.current, originalImg])

  /** Referencia a la caja delimitadora objetivo a cada momento */
  const [target, setTarget] = useState<HTMLElement>()
  /**
   * Se asegura que si se cambia la caja seleccionada desde afuera del
   * componente la interfaz se corresponda con este cambio de seleccion.
   */
  useEffect(() => {
    if (!boundingBoxSelected) {
      setTarget(undefined)
    } else {
      setTarget(document.getElementById(String(boundingBoxSelected))!)
    }
  }, [boundingBoxSelected])
  /** Referencia a objeto encargado del movimiento de cajas */
  const moveable = createRef<Moveable>()
  /**
   * Funcion a ejecutar cuando se cliquea una Caja delimitadora.
   * Permite que el target se seleccione dinamicamente acorde a
   * la caja delimitadora que se haya cliqueado.
   * @param e - event
   */
  function onMouseDown(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation() // Evitar que arrastrar Caja arrastre imagen de fondo.
    const nativeEvent = e.nativeEvent
    const targetElement = nativeEvent.target as HTMLElement

    setBoundingBoxSelected(targetElement.id)
    setTarget(targetElement)
    moveable.current?.dragStart(nativeEvent)
  }

  return (
    <Card className="overflow-hidden mb-6">
      {/* Listado de herramientas para la interaccion con la iamgen. */}
      <div className="bg-slate-100 p-2 border-b">
        <div id="Tools container" className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Tools</h2>
          {file && (
            <div id="Buttons Group" className="flex gap-2">
              {enable.autodetecButton && detectBBFunction && (
                <Button
                  onClick={() => {
                    handleAutodetect(file)
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-black bg-white hover:bg-slate-50"
                >
                  <Bot className="h-4 w-4" />
                  <span>Autodetect Bounding Boxes</span>
                </Button>
              )}
              {/* Esta rota la funcionalidad de rotar imagen, por ahora no usar
              {enable.rotateButton && (
                <Button
                  onClick={() => {handleRotate()}}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-black bg-white hover:bg-slate-50"
                >
                  <RotateCw className="h-4 w-4" />
                  <span>{`Rotate 90º from ${rotation}º`}</span>
                </Button>
              )} */}

              {enable.invertColorButton && (
                <Button
                  onClick={() => {
                    handleInvertColor()
                  }}
                  variant="outline"
                  size="sm"
                  className={clsx(
                    "flex items-center gap-2",
                    invertColor
                      ? "bg-white text-black hover:bg-slate-50"
                      : "bg-slate-800 text-white hover:bg-slate-700",
                  )}
                >
                  <Palette className="h-4 w-4" />
                  <span>Invert colors</span>
                </Button>
              )}
              {enable.drawButton && (
                <Button
                  onClick={() => {
                    handleAddBB()
                  }}
                  variant="outline"
                  size="sm"
                  className={clsx(
                    "flex items-center gap-2",
                    "bg-white text-black hover:bg-slate-50",
                  )}
                >
                  <Square className="h-4 w-4" />
                  <span>Add Box</span>
                </Button>
              )}
              {boundingBoxSelected && (
                <Button
                  onClick={() => {
                    handleDeleteBB(boundingBoxSelected)
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-red-100 text-red-700 hover:bg-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Box</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Visor/Cargador de imagen. */}
      <div
        className={clsx(
          "w-full h-[400px]",
          "flex items-center justify-center",
          " bg-slate-50 overflow-hidden",
        )}
      >
        {!file ? (
          // Si no hay imagen disponible permite que el usuario la cargue
          <ImageLoader handleImageLoad={handleLoad} />
        ) : (
          // Sino la muestra con el editor visual
          /**
           * Div que asegura que la imagen ocupe todo el espacio disponible
           * y que el fondo sea cuadriculado tipo fondo png.
           */
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              backgroundImage: `
                      linear-gradient(45deg, #ccc 25%, transparent 25%),
                      linear-gradient(-45deg, #ccc 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #ccc 75%),
                      linear-gradient(-45deg, transparent 75%, #ccc 75%)
                  `,
              backgroundSize: "60px 60px",
              backgroundPosition: "0 0, 0 30px, 30px -30px, -30px 0px",
            }}
          >
            {/* Es necesaria modificar la escala en relacion a la imagen respecto al 
              contenedor para que en un inicio la imagen encaje en el espacio disponible.
              Y initial scale correspoda a la situacion donde el contenedor encaja 
              perfecto */}
            {containerScale && (
              <TransformWrapper
                key={`TransformWrapper`}
                initialScale={containerScale}
                minScale={containerScale * 0.25}
                maxScale={containerScale * 10}
                centerOnInit
                centerZoomedOut
                doubleClick={{ step: 0.9 }}
                onTransformed={(e) => {
                  setImgScale(e.instance.transformState.scale)
                }}
              >
                <TransformComponent
                  wrapperStyle={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                  }}
                  contentStyle={{
                    position: "relative",
                    //background: "blue"
                  }}
                >
                  <div id="imageWithBBcontainer" className="relative bg-green-600">
                    <img
                      // className="border-black"
                      ref={imgRef}
                      src={file}
                      alt="Imagen de placa"
                      onLoad={(e) => {
                        const img = e.currentTarget
                        // forzalo a su tamaño intrínseco:
                        img.style.width = img.naturalWidth + "px"
                        img.style.height = img.naturalHeight + "px"
                      }}
                      style={{
                        width: "auto",
                        height: "auto",
                        maxWidth: "none",
                        maxHeight: "none",
                        objectFit: "none",
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                        filter: invertColor ? "none" : "invert(1)",
                        transition: "filter 0.3s ease",
                      }}
                    />
                    {boundingBoxes.map((box) => (
                      <div
                        key={"bounding-box:" + box.id}
                        id={"" + box.id}
                        onMouseDown={onMouseDown}
                        className={clsx("absolute border-2 ", "border-blue-500", "cursor-pointer")}
                        style={{
                          left: `${box.x}px`,
                          top: `${box.y}px`,
                          width: `${box.width}px`,
                          height: `${box.height}px`,
                          backgroundColor: "rgba(0, 0, 255, 0.1)",
                        }}
                      />
                    ))}
                  </div>
                  <Moveable
                    ref={moveable}
                    target={target}
                    draggable
                    resizable
                    pinchable
                    onDrag={({
                      target,
                      beforeDelta,
                      beforeDist,
                      left,
                      top,
                      right,
                      bottom,
                      delta,
                      dist,
                      transform,
                      clientX,
                      clientY,
                    }: OnDrag) => {
                      target!.style.transform = transform
                    }}
                    onDragEnd={({ target, isDrag, clientX, clientY }) => {
                      /** Rect de la caja delimitadora */
                      const targetRect = target.getBoundingClientRect()
                      /** Rect de la imagen */
                      const imageRect = imgRef.current!.getBoundingClientRect()

                      const relativeX = targetRect.left - imageRect.left
                      const relativeY = targetRect.top - imageRect.top

                      const originalScaleX = relativeX / imgScale
                      const originalScaleY = relativeY / imgScale

                      target.style.transform = `translate(0px, 0px)`
                      target.style.left = `${originalScaleX}px`
                      target.style.top = `${originalScaleY}px`

                      setBoundingBoxes(
                        boundingBoxes.map((box) =>
                          box.id != boundingBoxSelected
                            ? box
                            : {
                                ...box,
                                x: originalScaleX,
                                y: originalScaleY,
                              },
                        ),
                      )
                    }}
                    onResize={({
                      target,
                      width,
                      height,
                      dist,
                      delta,
                      direction,
                      clientX,
                      clientY,
                      drag,
                    }: OnResize) => {
                      const [translateX, translateY] = drag.beforeTranslate
                      delta[0] && (target!.style.width = `${width}px`)
                      delta[1] && (target!.style.height = `${height}px`)
                      target.style.transform = `translate(${translateX}px, ${translateY}px)`
                    }}
                    onResizeEnd={({ target, isDrag, clientX, clientY }) => {
                      /** Rect de la caja delimitadora */
                      const targetRect = target.getBoundingClientRect()
                      /** Rect de la imagen */
                      const imageRect = imgRef.current!.getBoundingClientRect()

                      const relativeX = targetRect.left - imageRect.left
                      const relativeY = targetRect.top - imageRect.top

                      const originalScaleX = relativeX / imgScale
                      const originalScaleY = relativeY / imgScale
                      const originalWidth = targetRect.width / imgScale
                      const originalHeigth = targetRect.height / imgScale

                      target.style.transform = `translate(0px, 0px)`
                      target.style.left = `${originalScaleX}px`
                      target.style.top = `${originalScaleY}px`
                      target.style.width = `${originalWidth}px`
                      target.style.height = `${originalHeigth}px`

                      setBoundingBoxes(
                        boundingBoxes.map((box) =>
                          box.id != boundingBoxSelected
                            ? box
                            : {
                                ...box,
                                x: originalScaleX,
                                y: originalScaleY,
                                width: originalWidth,
                                height: originalHeigth,
                              },
                        ),
                      )
                    }}
                  />
                </TransformComponent>
              </TransformWrapper>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
