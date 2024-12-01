import { type ClassValue, clsx } from "clsx"
import { inv, matrix, multiply, number, transpose } from "mathjs"
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
  DIFFERENT_PROMP_SIZE: 1001,
  INSUFFICIENT_MATCHES: 1002,
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
      "Insufficient matches, at least 2 are required for inference with linear regression.",
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

export function legendreAlgoritm(x: number[], y: number[]): ((value: number) => number) {
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

  x.sort((a, b) => a - b)
  y.sort((a, b) => a - b)

  const degree = 8

  // Generar la matriz de Legendre
  function legendreBasis(x: number, k: number): number {
    if (k === 0)
      return 1
    if (k === 1)
      return x
    return ((2 * k - 1) * x * legendreBasis(x, k - 1) - (k - 1) * legendreBasis(x, k - 2)) / k
  }

  const P = x.map(xi =>
    Array.from({ length: degree + 1 }, (_, k) => legendreBasis(xi, k)),
  )

  // Matriz de diseño
  const X = matrix(P)

  // Transpuesta de X
  const XT = transpose(X)

  // Calcular coeficientes: (XT * X)^-1 * XT * y
  const Y = matrix(y)
  const coefficients = multiply(
    multiply(inv(multiply(XT, X)), XT),
    Y,
  )

  return function (value: number): number {
    return (coefficients.toArray() as number[]).reduce(
      (sum: number, coeff: number, k: number) => sum + coeff * legendreBasis(value, k)
      , 0,
    )
  }
}
