import * as tf from "@tensorflow/tfjs";
import { type ClassValue, clsx } from "clsx";
import { Shapes } from "lucide-react";
import { inv, lusolve, matrix, multiply, transpose } from "mathjs";
import { twMerge } from "tailwind-merge";
import type { BoundingBox } from "~/types/BoundingBox";
import type { StepSpecificInfoForm } from "~/types/ProcessInfoForm";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * A simple, *insecure* 32-bit hash that's short, fast, and has no dependencies.
 * Loosely based on the Java version.
 * @see https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
 */
export function simpleHash(str: string) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
	}
	return hash >>> 0;
}

/**
 * Converts a numeric ID to a color string.
 * This function generates a color based on the ID by using a simple hash function
 * and then getting a color from a predefined palette.
 */
export function idToColor(id: string): string {
	const colors = ["red", "blue", "green"];
	const index = simpleHash(id) % colors.length;
	return colors[index];
}

export function generateRange(
	min: number,
	max: number,
	count: number,
): number[] {
	return Array.from(
		{ length: count },
		(_, i) => min + (i * (max - min)) / (count - 1),
	);
}

function sortArraysByFirst(
	x: number[],
	y: number[],
): [x: number[], y: number[]] {
	const combined = x.map((value: number, index: number) => ({
		x: value,
		y: y[index],
	}));
	combined.sort((a, b) => a.x - b.x);
	const sortedX = combined.map((item) => item.x);
	const sortedY = combined.map((item) => item.y);
	return [sortedX, sortedY];
}

export const ErrorCodes = {
	DIFFERENT_PROMP_SIZE: 501,
	INSUFFICIENT_MATCHES: 502,
	LESS_DATA_THAN_DEGREE: 503,
	DEGREE_UNDEFINED: 504,
};

export class CustomError extends Error {
	code: number;
	constructor(code: number, message: string) {
		super(message);
		this.code = code;
	}
}

/**
 * Recibe una serie de cordenadas (x, y) y construye un aproximacion
 * Spline Cuadratica para los mismos.
 * Explicacion spline (https://math.libretexts.org/Workbench/Numerical_Methods_with_Applications_(Kaw)/5%3A_Interpolation/5.05%3A_Spline_Method_of_Interpolation)
 * @param {number[]} x - Valores en el eje X. Largo minimo 2
 * @param {number[]} y - Valores en el eje Y
 * @returns {{
 *  funct: ((value: number) => number)
 *  derived: ((value: number) => number)
 * }} -
 * Función de interpolación para ubicar nuevos x y Funcion de para hallar
 * calcular derivada en un punto dado
 */
export function splineCuadratic(
	x: number[],
	y: number[],
): {
	funct: (value: number) => number;
	derived: (value: number) => number;
} {
	if (x.length < 2)
		throw new Error(
			`At least two points are needed to buil a spline. Count of points: ${x.length}`,
		);

	const puntos = x.map((value, i) => ({ x: value, y: y[i] }));

	const n: number = puntos.length - 1; // Cantidad de intervalos, vamos a ajustar 1 polinomio por intervalo
	// const cols: number = 3 * n // 3 incognitas por polinomio
	// const rows: number = cols // 1 ecuacion para resolver cada incognita

	const coeffMatrix: number[][] = [];
	const results: number[] = [];
	// Primeras 2*n ecuaciones
	for (let i = 0; i < n; i++) {
		// Ecuacion 1
		let row: number[] = Array.from({ length: 3 * n }, () => 0);
		const idx = i * 3;
		row[idx] = puntos[i].x ** 2;
		row[idx + 1] = puntos[i].x;
		row[idx + 2] = 1;
		coeffMatrix.push(row);
		results.push(puntos[i].y);

		// Ecuacion 2
		row = Array.from({ length: 3 * n }, () => 0);
		row[idx] = puntos[i + 1].x ** 2;
		row[idx + 1] = puntos[i + 1].x;
		row[idx + 2] = 1;
		coeffMatrix.push(row);
		results.push(puntos[i + 1].y);
	}

	// Siguientes n-1 ecuaciones
	for (let i = 0; i < n - 1; i++) {
		const row: number[] = Array.from({ length: 3 * n }, () => 0);
		row[i * 3] = 2 * puntos[i].x; // ai * 2 * xi
		row[i * 3 + 1] = 1; // bi
		row[(i + 1) * 3] = 2 * puntos[i].x; // a(i+1) * 2 * xi
		row[(i + 1) * 3 + 1] = 1; // (bi+1)
		coeffMatrix.push(row);
		results.push(0);
	}

	// Ultima ecuacion (1er a vale 0)
	const row: number[] = Array.from({ length: 3 * n }, () => 0);
	row[0] = 1; // row[(n - 1) * 3] = 0
	coeffMatrix.push(row);
	results.push(0);

	// resolver: coeffMatrix * unknowns = results
	const coeff = matrix(coeffMatrix);
	const res = matrix(results);

	const solution = lusolve(coeff, res); // mathjs devuelve una matriz columna

	// Coeficientes a1, b1, c1, a2, b2, c2, ..., an, bn, cn
	const coef: number[] = solution
		.valueOf()
		.flat()
		.map((c) => Number(c));

	// Funciones por partes
	const functionsArr: ((x: number) => number)[] = []; // Funcion como tal
	const derivedArr: ((x: number) => number)[] = []; // Derivadas
	for (let i = 0; i < n; i++) {
		const idx = i * 3;
		const segmentFunction = (x: number) => {
			return coef[idx] * x ** 2 + coef[idx + 1] * x + coef[idx + 2];
		};
		functionsArr.push(segmentFunction);
		const segmentDerived = (x: number) => {
			return 2 * coef[idx] * x + coef[idx + 1];
		};
		derivedArr.push(segmentDerived);
	}
	const intervals: { start: number; end: number }[] = functionsArr.map(
		(_, idx) => ({
			start: puntos[idx].x,
			end: puntos[idx + 1].x,
		}),
	);

	const splineCase: (value: number) => number = (value: number) => {
		let result: number;
		for (let i = 0; i < intervals.length; i++) {
			if (value >= intervals[i].start && value < intervals[i].end) {
				result = functionsArr[i](value);
				break;
			}
		}

		if (value < intervals[0].start) result = functionsArr[0](value);
		else if (value >= intervals[intervals.length - 1].start)
			result = functionsArr[intervals.length - 1](value);

		return result!;
	};

	const derived: (value: number) => number = (value: number) => {
		let result: number;
		for (let i = 0; i < intervals.length; i++) {
			if (value >= intervals[i].start && value < intervals[i].end) {
				result = derivedArr[i](value);
				break;
			}
		}

		if (value < intervals[0].start) result = derivedArr[0](value);
		else if (value >= intervals[intervals.length - 1].start)
			result = derivedArr[intervals.length - 1](value);

		return result!;
	};

	return { funct: splineCase, derived };
}

/**
 * Recibe una serie de cordenadas (x, y) y construye un aproximacion
 * lineal para los mismos.
 * @param {number[]} x - Valores en el eje X. Largo minimo 2
 * @param {number[]} y - Valores en el eje Y
 * @returns {{
 *  funct: ((value: number) => number)
 *  derived: ((value: number) => number)
 * }} -
 * Función de interpolación para ubicar nuevos x y Funcion de para hallar
 * calcular derivada en un punto dado
 */
export function linearRegressionWhitDerived(
	x: number[],
	y: number[],
): {
	funct: (value: number) => number;
	derived: (value: number) => number;
} {
	if (x.length !== y.length) {
		throw new CustomError(
			ErrorCodes.DIFFERENT_PROMP_SIZE,
			"Los arreglos de números recibidos deben tener el mismo tamaño.",
		);
	}

	if (x.length < 2) {
		throw new CustomError(
			ErrorCodes.INSUFFICIENT_MATCHES,
			"Insufficient matches, at least 2 are required for inference with linear regression.",
		);
	}

	const n = x.length;
	const sumX = x.reduce((acc, cur) => acc + cur, 0);
	const sumY = y.reduce((acc, cur) => acc + cur, 0);
	const sumMul = x
		.map((val, i) => val * y[i])
		.reduce((acc, cur) => acc + cur, 0);
	const sumXCuad = x.map((val) => val ** 2).reduce((acc, cur) => acc + cur, 0);
	const promX = sumX / n;
	const promY = sumY / n;

	const m = (n * sumMul - sumX * sumY) / (n * sumXCuad - sumX ** 2);
	const b = promY - m * promX;

	return {
		funct(value: number): number {
			return m * value + b;
		},
		derived(_value: number): number {
			return m;
		},
	};
}

/**
 * Recibe una serie de cordenadas (x, y) y construye un aproximacion
 * lineal para los mismos.
 * @param {number[]} x - Valores en el eje X. Largo minimo 2
 * @param {number[]} y - Valores en el eje Y
 * @returns {funct: ((value: number) => number)}
 * Función de interpolación para ubicar nuevos x.
 */
export function linearRegression(
	x: number[],
	y: number[],
): (value: number) => number {
	if (x.length !== y.length) {
		throw new CustomError(
			ErrorCodes.DIFFERENT_PROMP_SIZE,
			"Los arreglos de números recibidos deben tener el mismo tamaño.",
		);
	}

	if (x.length < 2) {
		throw new CustomError(
			ErrorCodes.INSUFFICIENT_MATCHES,
			"Insufficient matches, at least 2 are required for inference with linear regression.",
		);
	}

	const n = x.length;
	const sumX = x.reduce((acc, cur) => acc + cur, 0);
	const sumY = y.reduce((acc, cur) => acc + cur, 0);
	const sumMul = x
		.map((val, i) => val * y[i])
		.reduce((acc, cur) => acc + cur, 0);
	const sumXCuad = x.map((val) => val ** 2).reduce((acc, cur) => acc + cur, 0);
	const promX = sumX / n;
	const promY = sumY / n;

	const m = (n * sumMul - sumX * sumY) / (n * sumXCuad - sumX ** 2);
	const b = promY - m * promX;

	function regFun(value: number): number {
		return m * value + b;
	}

	return regFun;
}

export function piecewiseLinearRegression(
	x: number[],
	y: number[],
): (value: number) => number {
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
		);
	}

	if (x.length <= 1) {
		throw new CustomError(
			ErrorCodes.INSUFFICIENT_MATCHES,
			"Insufficient matches, at least 2 are required for inference with piece wise linear regression.",
		);
	}

	const [sortedX, sortedY] = sortArraysByFirst(x, y);

	const functionsArr: ((value: number) => number)[] = [];
	for (let i = 0; i < x.length; i++) {
		const segmentFunction = linearRegression(
			[sortedX[i], sortedX[i + 1]],
			[sortedY[i], sortedY[i + 1]],
		);
		functionsArr.push(segmentFunction);
	}
	const functionOuOfRange = linearRegression(
		[sortedX[0], sortedX[sortedX.length - 1]],
		[sortedY[0], sortedY[sortedY.length - 1]],
	);

	return function piecewiseFunction(value: number): number {
		if (value < sortedX[0] || value >= sortedX[sortedX.length - 1]) {
			return functionOuOfRange(value);
		}
		for (let i = sortedX.length - 1; i >= 0; i--) {
			if (sortedX[i] <= value) {
				return functionsArr[i](value);
			}
		}

		throw new Error(
			`El valor ${value} no está contemplado por el dominio de la función`,
		);
	};
}

export function legendreAlgoritm(
	x: number[],
	y: number[],
	degree = -1,
): (value: number) => number {
	if (x.length !== y.length) {
		throw new CustomError(
			ErrorCodes.DIFFERENT_PROMP_SIZE,
			"Los arreglos de números recibidos deben tener el mismo tamaño.",
		);
	}

	if (x.length <= 1) {
		throw new CustomError(
			ErrorCodes.INSUFFICIENT_MATCHES,
			"Insufficient matches, at least 2 are required for inference with legendre algoritm.",
		);
	}

	if (!degree) {
		throw new CustomError(
			ErrorCodes.DEGREE_UNDEFINED,
			`A valid degree value (greater than 0) must be specified.`,
		);
	}

	const n = x.length;
	if (degree >= n) {
		throw new CustomError(
			ErrorCodes.LESS_DATA_THAN_DEGREE,
			`To approximate with a Legendre algorithm of degree ${degree}, at least ${degree + 1} data pairs are required.`,
		);
	}

	// Escalar los puntos al dominio [-1, 1]
	function obtainNormalizator(x: number[]): (value: number) => number {
		const min = Math.min(...x); // Valor mínimo en x
		const max = Math.max(...x); // Valor máximo en x
		return (value: number) => (2 * (value - min)) / (max - min) - 1;
	}
	const normalizator = obtainNormalizator(x);
	const x_scaled = x.map(normalizator);

	function legendreBasisIterative(x: number, k: number): number {
		if (k === 0) return 1; // P0(x) = 1
		if (k === 1) return x; // P1(x) = x

		let Pk_2 = 1; // P0(x)
		let Pk_1 = x; // P1(x)
		let Pk = 0;

		for (let i = 2; i <= k; i++) {
			Pk = ((2 * i - 1) * x * Pk_1 - (i - 1) * Pk_2) / i;
			Pk_2 = Pk_1;
			Pk_1 = Pk;
		}

		return Pk;
	}

	const P = x_scaled.map((xi) =>
		Array.from({ length: degree + 1 }, (_, k) => legendreBasisIterative(xi, k)),
	);

	// Matriz de diseño
	const X = matrix(P);

	// Transpuesta de X
	const XT = transpose(X);

	// Calcular coeficientes: (XT * X)^-1 * XT * y
	const Y = matrix(y);
	const coefficients = multiply(inv(multiply(XT, X)), multiply(XT, Y));

	return (value: number): number => {
		const val = normalizator(value);
		return (coefficients.toArray() as number[]).reduce(
			(sum: number, coeff: number, k: number) =>
				sum + coeff * legendreBasisIterative(val, k),
			0,
		);
	};
}

export function iou(box1: BoundingBox, box2: BoundingBox) {
	function union(box1: BoundingBox, box2: BoundingBox) {
		const {
			x: box1_x1,
			y: box1_y1,
			width: box1_width,
			height: box1_height,
		} = box1;
		const box1_x2 = box1_x1 + box1_width;
		const box1_y2 = box1_y1 + box1_height;

		const {
			x: box2_x1,
			y: box2_y1,
			width: box2_width,
			height: box2_height,
		} = box2;
		const box2_x2 = box2_x1 + box2_width;
		const box2_y2 = box2_y1 + box2_height;

		const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1);
		const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1);
		return box1_area + box2_area - intersection(box1, box2);
	}

	function intersection(box1: BoundingBox, box2: BoundingBox) {
		const {
			x: box1_x1,
			y: box1_y1,
			width: box1_width,
			height: box1_height,
		} = box1;
		const box1_x2 = box1_x1 + box1_width;
		const box1_y2 = box1_y1 + box1_height;

		const {
			x: box2_x1,
			y: box2_y1,
			width: box2_width,
			height: box2_height,
		} = box2;
		const box2_x2 = box2_x1 + box2_width;
		const box2_y2 = box2_y1 + box2_height;

		const x1 = Math.max(box1_x1, box2_x1);
		const y1 = Math.max(box1_y1, box2_y1);
		const x2 = Math.min(box1_x2, box2_x2);
		const y2 = Math.min(box1_y2, box2_y2);
		return (x2 - x1) * (y2 - y1);
	}

	return intersection(box1, box2) / union(box1, box2);
}

export function getNextId(boundingBoxes: BoundingBox[]) {
	const maxId = boundingBoxes.reduce((max, box) => Math.max(max, box.id), 0);
	return maxId + 1;
}

export function totalStepsCompleted(
	spectrumId: number,
	steps: StepSpecificInfoForm[],
): number {
	let stepsCompleted = 0;
	// Recorrer etapas por las que tiene que pasar un espectro
	for (let stepId = 0; stepId < steps.length; stepId++) {
		// Revisa valor del espectro en etapa i y suma si esta completado
		if (steps[stepId].states![spectrumId] === "COMPLETE") {
			stepsCompleted += 1;
		}
	}
	return stepsCompleted;
}

/**
 * Realiza un suavizado por promedio.
 * @param {number[]} data Datos a promediar
 * @param {number} windowSize Cantidad de datos vecinos a promediar
 * @returns {number[]} Datos suavizados
 */
export function meanSmooth(data: number[], windowSize = 3) {
	const half = Math.floor(windowSize / 2);
	const smoothed = [];

	for (let i = 0; i < data.length; i++) {
		let sum = 0;
		let count = 0;

		for (let j = -half; j <= half; j++) {
			const idx = i + j;
			if (idx >= 0 && idx < data.length) {
				sum += data[idx];
				count++;
			}
		}

		smoothed.push(sum / count);
	}

	return smoothed;
}

/**
 * Realiza un suavizado por promedio ponderado con ventana triangular.
 * Los valores cercanos al centro de la ventana tienen más peso.
 * @param {number[]} data Datos a promediar
 * @param {number} windowSize Tamaño de la ventana (debe ser impar)
 * @returns {number[]} Datos suavizados
 */
export function weightedSmooth(data: number[], windowSize = 3): number[] {
	if (windowSize % 2 === 0) throw new Error("windowSize debe ser impar");
	const half = Math.floor(windowSize / 2);
	const smoothed = [];

	// Generar pesos triangulares, por ejemplo para windowSize=5: [1, 2, 3, 2, 1]
	const weights = [];
	for (let i = -half; i <= half; i++) {
		weights.push(half + 1 - Math.abs(i));
	}
	const totalWeight = weights.reduce((a, b) => a + b, 0);

	for (let i = 0; i < data.length; i++) {
		let weightedSum = 0;
		let weightSum = 0;

		for (let j = -half; j <= half; j++) {
			const idx = i + j;
			const w = weights[j + half];
			if (idx >= 0 && idx < data.length) {
				weightedSum += data[idx] * w;
				weightSum += w;
			}
		}

		smoothed.push(weightedSum / weightSum);
	}

	return smoothed;
}

/**
 * Aumenta el contraste empujando los valores hacia los extremos (0 o 1),
 * desde la mitad.
 * @param {number[]} data Arreglo de valores entre 0 y 1
 * @param {number} umbral Umbral de decicion
 * @returns {number[]} Arreglo transformado
 */
export function pushToExtremes(data: number[], umbral: number): number[] {
	const normalized = normalizeMinMax(data);
	return normalized.map((v) => {
		return v > umbral ? 1 : 0;
	});
}

/**
 * Aumenta el contraste empujando los valores hacia los extremos (0 o 1),
 * desde la mitad, emplea tensorflow.
 * @param {tf.TensorLike} data Tensor de valores entre 0 y 1
 * @param {number} umbral Umbral de decicion
 * @returns {tf.TensorLike} Arreglo transformado
 */
export function pushToExtremeTf(data: tf.TensorLike, umbral: number): number[] {
	const b = tf.zeros(data.shape.toArray());
	const normalized = normalizeMinMax(data);
	return normalized.map((v) => {
		return v > umbral ? 1 : 0;
	});
}

/**
 * Recibe un arreglo de datos y los normaliza.
 * @param {number[]} data - Arreglo de datos a normalizar.
 * @param {number} min - Minimo a considerar para la conversion de rango.
 * @param {number} max - Maximo a considerar para la conversion de rango.
 * @returns {number[]} -
 * Arreglo de datos normalizado.
 */
export function normalizeMinMax(
	data: number[],
	min?: number,
	max?: number,
): number[] {
	if (!min) min = Math.min(...data);
	if (!max) max = Math.max(...data);

	return data.map((x) => (x - min) / (max - min));
}

/**
 * Guarda informacion de funciones en un grafico.
 *
 * @param datasets
 * @param nombreArchivo
 * @param medium
 * @param threshold
 * @param colors
 */
export function guardarFuncion(
	datasets: number[][],
	nombreArchivo = "grafico.png",
	medium: number | undefined,
	threshold: number | undefined,
	colors: string[] = [],
) {
	const width = 800;
	const height = 400;
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d")!;

	// Fondo blanco
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, width, height);

	// Dibujar cada curva
	datasets.forEach((dataArray, i) => {
		const min = Math.min(...dataArray);
		const max = Math.max(...dataArray);

		const normValues = dataArray.map((v) => (v - min) / (max - min));
		const color = colors[i] || `hsl(${(i * 60) % 360}, 100%, 40%)`;

		ctx.beginPath();
		ctx.strokeStyle = color;
		ctx.lineWidth = 2;

		normValues.forEach((val, j) => {
			const x = (j / (normValues.length - 1)) * width;
			const y = height - val * height;
			if (j === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		});

		ctx.stroke();
	});

	// Dibujar línea vertical común (medium)
	if (medium && medium >= 0 && medium < datasets[0].length) {
		const xMedium = (medium / (datasets[0].length - 1)) * width;
		ctx.beginPath();
		ctx.moveTo(xMedium, 0);
		ctx.lineTo(xMedium, height);
		ctx.strokeStyle = "red";
		ctx.lineWidth = 1;
		ctx.setLineDash([5, 3]);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	// Dibujar línea horizontal (threshold)
	if (threshold && threshold >= 0 && threshold <= 1) {
		const yThreshold = height - threshold * height;
		ctx.beginPath();
		ctx.moveTo(0, yThreshold);
		ctx.lineTo(width, yThreshold);
		ctx.strokeStyle = "green";
		ctx.lineWidth = 1;
		ctx.setLineDash([2, 4]);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	// Descargar imagen automáticamente
	const link = document.createElement("a");
	link.download = nombreArchivo;
	link.href = canvas.toDataURL("image/png");
	link.click();
}

/**
 * Dibuja una recta y una serie de puntos sobre un canvas y lo descarga como imagen.
 *
 * @param puntos Lista de puntos [x, y]
 * @param recta Coeficientes de la recta en forma y = mx + b → { m, b }
 * @param nombreArchivo Nombre del archivo a guardar
 */
export function guardarRectaYPuntos(
	puntos: [number, number][],
	recta: { m: number; b: number },
	nombreArchivo = "recta_puntos.png",
) {
	const width = 800;
	const height = 400;
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d")!;

	// Fondo blanco
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, width, height);

	// Obtener extremos para normalizar
	const xs = puntos.map(([x]) => x);
	const ys = puntos.map(([, y]) => y);
	const allX = xs.concat([-10, 10]); // valores de prueba para extender la recta
	const allY = ys.concat(recta.m * -10 + recta.b, recta.m * 10 + recta.b);

	const minX = Math.min(...allX);
	const maxX = Math.max(...allX);
	const minY = Math.min(...allY);
	const maxY = Math.max(...allY);

	// Funciones de escala
	const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * width;
	const scaleY = (y: number) => height - ((y - minY) / (maxY - minY)) * height;

	// Dibujar recta
	const x1 = minX;
	const y1 = recta.m * x1 + recta.b;
	const x2 = maxX;
	const y2 = recta.m * x2 + recta.b;

	ctx.beginPath();
	ctx.moveTo(scaleX(x1), scaleY(y1));
	ctx.lineTo(scaleX(x2), scaleY(y2));
	ctx.strokeStyle = "blue";
	ctx.lineWidth = 2;
	ctx.stroke();

	// Dibujar puntos
	ctx.fillStyle = "red";
	for (const [x, y] of puntos) {
		ctx.beginPath();
		ctx.arc(scaleX(x), scaleY(y), 4, 0, 2 * Math.PI);
		ctx.fill();
	}

	// Descargar imagen
	const link = document.createElement("a");
	link.download = nombreArchivo;
	link.href = canvas.toDataURL("image/png");
	link.click();
}

export async function downloadGrayscaleImage(
	input4d: tf.Tensor4D,
	nombreArchivo = "image.png",
) {
	// 1. Asegurate que es tensor 4D y grayscale
	if (input4d.rank !== 4 || input4d.shape[3] !== 1) {
		throw new Error(
			"Se espera un tensor " + "[batch, height, width, 1] en escala de grises.",
		);
	}

	// 2. Tomá la primera imagen del batch
	const single = input4d.slice(
		[0, 0, 0, 0],
		[1, input4d.shape[1], input4d.shape[2], 1],
	);
	const squeezed = single.squeeze([0, 3]) as tf.Tensor2D; // shape [height, width]

	// 3. Convertí a Uint8Array para canvas (0–255)
	const data = await squeezed.mul(255).clipByValue(0, 255).toInt().data();
	const [h, w] = squeezed.shape;

	// 4. Crear canvas y pintar
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d")!;
	const imageData = ctx.createImageData(w, h);
	const buf = imageData.data;

	for (let i = 0; i < data.length; i++) {
		const val = data[i];
		buf[4 * i] = val;
		buf[4 * i + 1] = val;
		buf[4 * i + 2] = val;
		buf[4 * i + 3] = 255;
	}

	ctx.putImageData(imageData, 0, 0);

	// 5. Descargar como PNG
	const link = document.createElement("a");
	link.download = nombreArchivo;
	link.href = canvas.toDataURL("image/png");
	link.click();

	// Eliminá el canvas si no lo necesitás
	canvas.remove();
}
