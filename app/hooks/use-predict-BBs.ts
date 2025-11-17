import { InferenceSession, Tensor } from "onnxruntime-web"
import { useEffect, useState } from "react"
import { iou } from "~/lib/utils"
import type { BBClassesProps } from "~/types/BBClasses"
import type { BoundingBox } from "~/types/BoundingBox"

interface Response {
  input: string
  output: BoundingBox[]
}

export function usePredictBBs(
  size: number,
  model: string,
  classes: BBClassesProps[],
  forceMaxWidth = false,
  confidence_threshold = 0.75,
): (img_src: string) => Promise<BoundingBox[]> {
  const SIZE_M = size
  const CLASSES = classes
  const CONFIDENCE_THRESHOLD = confidence_threshold
  const IOU_THRESHOLD = 0.7
  const [onnxSession, setOnnxSession] = useState<InferenceSession | null>(null)

  const [lastResponse, setLastResponse] = useState<Response>({
    input: "",
    output: [],
  })

  useEffect(() => {
    let s: InferenceSession | null = null
    InferenceSession.create(`/models/${model}`).then((session) => {
      s = session
      setOnnxSession(session)
    })
    return () => void s?.release()
  }, [model])

  async function prepare_input(img_src: string) {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(new Error(`No se pudo cargar "${img_src}"`))
      img.src = img_src
    })

    const canvas = document.createElement("canvas")
    canvas.width = SIZE_M
    canvas.height = SIZE_M
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(image, 0, 0, SIZE_M, SIZE_M)

    const { data } = ctx.getImageData(0, 0, SIZE_M, SIZE_M) // Uint8ClampedArray
    const red: number[] = new Array(SIZE_M * SIZE_M)
    const green: number[] = new Array(SIZE_M * SIZE_M)
    const blue: number[] = new Array(SIZE_M * SIZE_M)
    for (let i = 0; i < SIZE_M * SIZE_M; i++) {
      red[i] = data[i * 4] / 255
      green[i] = data[i * 4 + 1] / 255
      blue[i] = data[i * 4 + 2] / 255
    }

    return {
      input: new Float32Array([...red, ...green, ...blue]),
      image,
    }
  }

  async function runInference(session: InferenceSession, input: Float32Array<ArrayBuffer>) {
    const feeds = {
      images: new Tensor("float32", input, [1, 3, SIZE_M, SIZE_M]),
    }
    const outputs = await session.run(feeds)
    return outputs
  }

  function processOutputs(outputs: InferenceSession.OnnxValueMapType, image: HTMLImageElement) {
    const { naturalWidth: NATURALWIDTH, naturalHeight: NATURALHEIGHT } = image

    const DATA = outputs.output0.data as Float32Array
    const COLS = outputs.output0.dims[2]
    const ROWS = outputs.output0.dims[1]

    let boundingBoxes: BoundingBox[] = []
    let id = 0
    for (let column = 0; column < COLS; column++) {
      const [class_id, prob] = [...Array.from({ length: ROWS - 4 }).keys()]
        .map((row) => [row, DATA[COLS * (row + 4) + column]])
        .reduce((accum, item) => (item[1] > accum[1] ? item : accum), [0, 0])

      if (prob < CONFIDENCE_THRESHOLD) {
        continue
      }

      const label = CLASSES[class_id]
      const xc: number = DATA[COLS * 0 + column]
      const yc: number = DATA[COLS * 1 + column]
      let w: number = DATA[COLS * 2 + column]
      let h: number = DATA[COLS * 3 + column]

      let x1 = xc - w / 2
      let y1 = yc - h / 2

      // Escalado
      x1 = x1 * (NATURALWIDTH / SIZE_M)
      y1 = y1 * (NATURALHEIGHT / SIZE_M)
      w = w * (NATURALWIDTH / SIZE_M)
      h = h * (NATURALHEIGHT / SIZE_M)

      // Modificacion para que el ancho valla hasta los extremos
      if (forceMaxWidth) {
        x1 = 0
        w = NATURALWIDTH
      }

      const boundingBox: BoundingBox = {
        id: id++,
        name: "",
        x: x1,
        y: y1,
        width: w,
        height: h,
        class_info: CLASSES[class_id] as BBClassesProps,
        prob,
      }

      boundingBoxes.push(boundingBox)
    }

    boundingBoxes = boundingBoxes.sort((bb1, bb2) => bb2.prob - bb1.prob)
    const result = []
    while (boundingBoxes.length > 0) {
      result.push(boundingBoxes[0])
      boundingBoxes = boundingBoxes.filter((bb) => iou(boundingBoxes[0], bb) < IOU_THRESHOLD)
    }
    return result
  }

  async function determineBBs(img_src: string): Promise<BoundingBox[]> {
    if (lastResponse.input === img_src) {
      return lastResponse.output
    }
    const { input, image } = await prepare_input(img_src)
    const outputs: InferenceSession.OnnxValueMapType = await runInference(onnxSession!, input)
    const processed_output: BoundingBox[] = processOutputs(outputs, image)
    setLastResponse({
      input: img_src,
      output: processed_output,
    })
    return processed_output
  }

  return determineBBs
}
