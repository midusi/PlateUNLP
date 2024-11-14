import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function linearRegression(x: number[], y: number[]) {
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
