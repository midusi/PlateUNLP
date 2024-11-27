import { type ClassValue, clsx } from "clsx"
import { inv, matrix, multiply, transpose } from "mathjs"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRange(min: number, max: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => min + (i * (max - min)) / (count - 1))
}

export function linearRegression(x: number[], y: number[]) {
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
    throw new Error("Los arreglos de números recibidos deben tener el mismo tamaño")
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

export function legendreAlgoritm(x: number[], y: number[]) {
  if (x.length !== y.length) {
    throw new Error("Los arreglos de números recibidos deben tener el mismo tamaño")
  }

  if (x.length === 0 || x.length === 1) {
    return function (_value: number): number {
      return 0
    }
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
