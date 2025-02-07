import type { BoundingBox } from "@/interfaces/BoundingBox"
import { type ClassValue, clsx } from "clsx"
import { inv, matrix, multiply, transpose } from "mathjs"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRange(min: number, max: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => min + (i * (max - min)) / (count - 1))
}

function sortArraysByFirst(x: number[], y: number[]): [x: number[], y: number[]] {
  const combined = x.map((value: number, index: number) => ({ x: value, y: y[index] }))
  combined.sort((a, b) => a.x - b.x)
  const sortedX = combined.map(item => item.x)
  const sortedY = combined.map(item => item.y)
  return [sortedX, sortedY]
}

export const ErrorCodes = {
  DIFFERENT_PROMP_SIZE: 501,
  INSUFFICIENT_MATCHES: 502,
  LESS_DATA_THAN_DEGREE: 503,
  DEGREE_UNDEFINED: 504,
}

export class CustomError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

export function linearRegression(x: number[], y: number[]): ((value: number) => number) {
  /**
   * x e y contienen una serie de valores que se corresponden
   * cada uno con el de la misma posición en el otro arreglo.
   * Esta función busca una recta que dado un valor de x
   * devuelva el un valor de y, o lo más cercano que se pueda
   * al minimizar el error que pueda haber entre todos los
   * pares de números.
   * La función devuelta, dado cualquier x, devuelve un y que
   * aproxima el valor ideal que debería corresponderle.
   * Dentro de las limitaciones de lo que se puede hacer con
   * una aproximación lineal a una correspondencia de
   * complejidad desconocida.
   */

  if (x.length !== y.length) {
    throw new CustomError(
      ErrorCodes.DIFFERENT_PROMP_SIZE,
      "Los arreglos de números recibidos deben tener el mismo tamaño.",
    )
  }

  if (x.length <= 1) {
    throw new CustomError(
      ErrorCodes.INSUFFICIENT_MATCHES,
      "Insufficient matches, at least 2 are required for inference with linear regression.",
    )
  }

  const n = x.length
  const sumX = x.reduce((acc, cur) => acc + cur, 0)
  const sumY = y.reduce((acc, cur) => acc + cur, 0)
  const sumMul = x.map((val, i) => val * y[i]).reduce((acc, cur) => acc + cur, 0)
  const sumXCuad = x.map(val => val ** 2).reduce((acc, cur) => acc + cur, 0)
  const promX = sumX / n
  const promY = sumY / n

  const m = (n * sumMul - sumX * sumY) / (n * sumXCuad - sumX ** 2)
  const b = promY - m * promX

  return function (value: number): number {
    return m * value + b
  }
}

export function piecewiseLinearRegression(x: number[], y: number[]): ((value: number) => number) {
  /**
   * x e y contienen una serie de valores que se corresponden
   * cada uno con el de la misma posición en el otro arreglo.
   * Esta función busca una recta entre cada par de puntos de
   * x e y. Con el conjunto de funciones definidas genera una
   * función por partes con la que dado cualquier píxel esta
   * responde que longitud de onda le corresponde.
   * Para los valores más allá del rango x especificado se
   * usa la función obtenida de la regresión lineal entre el
   * primer y último punto.
   */
  if (x.length !== y.length) {
    throw new CustomError(
      ErrorCodes.DIFFERENT_PROMP_SIZE,
      "Los arreglos de números recibidos deben tener el mismo tamaño.",
    )
  }

  if (x.length <= 1) {
    throw new CustomError(
      ErrorCodes.INSUFFICIENT_MATCHES,
      "Insufficient matches, at least 2 are required for inference with piece wise linear regression.",
    )
  }

  const [sortedX, sortedY] = sortArraysByFirst(x, y)

  const functionsArr: ((value: number) => number)[] = []
  for (let i = 0; i < x.length; i++) {
    const segmentFunction = linearRegression(
      [sortedX[i], sortedX[i + 1]],
      [sortedY[i], sortedY[i + 1]],
    )
    functionsArr.push(segmentFunction)
  }
  const functionOuOfRange = linearRegression(
    [sortedX[0], sortedX[sortedX.length - 1]],
    [sortedY[0], sortedY[sortedY.length - 1]],
  )

  return function piecewiseFunction(value: number): number {
    if (value < sortedX[0] || value >= sortedX[sortedX.length - 1]) {
      return functionOuOfRange(value)
    }
    for (let i = sortedX.length - 1; i >= 0; i--) {
      if (sortedX[i] <= value) {
        return functionsArr[i](value)
      }
    }

    throw new Error(`El valor ${value} no está contemplado por el dominio de la función`)
  }
}

export function legendreAlgoritm(x: number[], y: number[], degree: number = -1): ((value: number) => number) {
  if (x.length !== y.length) {
    throw new CustomError(
      ErrorCodes.DIFFERENT_PROMP_SIZE,
      "Los arreglos de números recibidos deben tener el mismo tamaño.",
    )
  }

  if (x.length <= 1) {
    throw new CustomError(
      ErrorCodes.INSUFFICIENT_MATCHES,
      "Insufficient matches, at least 2 are required for inference with legendre algoritm.",
    )
  }

  if (!degree) {
    throw new CustomError(
      ErrorCodes.DEGREE_UNDEFINED,
      `A valid degree value (greater than 0) must be specified.`,
    )
  }

  const n = x.length
  if (degree >= n) {
    throw new CustomError(
      ErrorCodes.LESS_DATA_THAN_DEGREE,
      `To approximate with a Legendre algorithm of degree ${degree}, at least ${degree + 1} data pairs are required.`,
    )
  }

  // Escalar los puntos al dominio [-1, 1]
  function obtainNormalizator(x: number[]): (value: number) => number {
    const min = Math.min(...x) // Valor mínimo en x
    const max = Math.max(...x) // Valor máximo en x
    return (value: number) => ((2 * (value - min)) / (max - min) - 1)
  }
  const normalizator = obtainNormalizator(x)
  const x_scaled = x.map(normalizator)

  function legendreBasisIterative(x: number, k: number): number {
    if (k === 0)
      return 1 // P0(x) = 1
    if (k === 1)
      return x // P1(x) = x

    let Pk_2 = 1 // P0(x)
    let Pk_1 = x // P1(x)
    let Pk = 0

    for (let i = 2; i <= k; i++) {
      Pk = ((2 * i - 1) * x * Pk_1 - (i - 1) * Pk_2) / i
      Pk_2 = Pk_1
      Pk_1 = Pk
    }

    return Pk
  }

  const P = x_scaled.map(xi =>
    Array.from({ length: degree + 1 }, (_, k) => legendreBasisIterative(xi, k)),
  )

  // Matriz de diseño
  const X = matrix(P)

  // Transpuesta de X
  const XT = transpose(X)

  // Calcular coeficientes: (XT * X)^-1 * XT * y
  const Y = matrix(y)
  const coefficients = multiply(
    inv(multiply(XT, X)),
    multiply(XT, Y),
  )

  return function (value: number): number {
    const val = normalizator(value)
    return (coefficients.toArray() as number[]).reduce(
      (sum: number, coeff: number, k: number) => sum + coeff * legendreBasisIterative(val, k)
      , 0,
    )
  }
}

export function iou(box1: BoundingBox, box2: BoundingBox) {
  function union(box1: BoundingBox, box2: BoundingBox) {
    const { x: box1_x1, y: box1_y1, width: box1_width, height: box1_height } = box1
    const box1_x2 = box1_x1 + box1_width
    const box1_y2 = box1_y1 + box1_height

    const { x: box2_x1, y: box2_y1, width: box2_width, height: box2_height } = box2
    const box2_x2 = box2_x1 + box2_width
    const box2_y2 = box2_y1 + box2_height

    const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1)
    const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1)
    return box1_area + box2_area - intersection(box1, box2)
  }

  function intersection(box1: BoundingBox, box2: BoundingBox) {
    const { x: box1_x1, y: box1_y1, width: box1_width, height: box1_height } = box1
    const box1_x2 = box1_x1 + box1_width
    const box1_y2 = box1_y1 + box1_height

    const { x: box2_x1, y: box2_y1, width: box2_width, height: box2_height } = box2
    const box2_x2 = box2_x1 + box2_width
    const box2_y2 = box2_y1 + box2_height

    const x1 = Math.max(box1_x1, box2_x1)
    const y1 = Math.max(box1_y1, box2_y1)
    const x2 = Math.min(box1_x2, box2_x2)
    const y2 = Math.min(box1_y2, box2_y2)
    return (x2 - x1) * (y2 - y1)
  }

  return intersection(box1, box2) / union(box1, box2)
}

export function getNextId(boundingBoxes: BoundingBox[]) {
  const maxId = boundingBoxes.reduce((max, box) => Math.max(max, box.id), 0)
  return maxId + 1
}
