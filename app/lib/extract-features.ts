import * as tf from "@tensorflow/tfjs";
import { Axis } from "@visx/axis";
import { AArrowDown } from "lucide-react";
import { max, mean, min, round } from "mathjs";
import {
	findPlateau,
	findXspacedPoints,
	getPointsInRect,
	obtainImageSegments,
	promediadoHorizontal,
} from "~/lib/image";
import { extremePoints } from "~/lib/trigonometry";
import {
	downloadGrayscaleImage,
	guardarFuncion,
	guardarRectaYPuntos,
	linearRegressionWhitDerived,
	meanSmooth,
	pushToExtremes,
	pushToExtremeTf,
	splineCuadratic,
	weightedSmooth,
} from "~/lib/utils";
import type { Point } from "~/types/Point";

/**
 * Parametros recibidos por extractScience
 * @interface extractScience
 */
export interface extractScienceProps {
	/** Tensor de pixeles 4D Grey [1, height, width, 1]*/
	science: tf.Tensor4D;
	/** Ancho de ciencia */
	width: number;
	/** Alto de ciencia */
	height: number;
	/** Cantidad de puntos intermedios a usar */
	countCheckpoints: number;
	/** Ancho a considerar para el analisis de segmentos */
	segmentWidth: number;
	/** Funcion de ajuste a usar */
	fitFunction?: "linal-regression" | "spline";
}

/** Respuesta de metodo extractScience */
export interface extractSpectrumResponse {
	/** Puntos medios elegidos para la extracción */
	mediasPoints: Point[];
	/** Apertura promedio detectada */
	opening: number;
	/** Funcion de la recta media del espectro medida en pixels */
	rectFunction: (value: number) => number;
	/**
	 * Promedio por columna (vertical respecto a la imagen) de los pixels pasan
	 * por rectFunction dentro de la apertura.
	 */
	transversalAvgs: number[];
	/**
	 * Mascara booleana que indica la region de la imagen donde se encuentra el
	 * espectro de ciencia [1, imageH, imageW, 1].
	 */
	spectrumMask: tf.Tensor4D;
}
/** Extrae las caracteristicas de un espectro de ciencia. */
export function extractScience({
	science,
	width,
	height,
	countCheckpoints,
	segmentWidth,
	fitFunction,
}: extractScienceProps): extractSpectrumResponse {
	//   /** Convertir a escala de grises */
	//   const [r, g, b, _] = tf.split(science, 4, 3)
	//   const imgTensor = r.mul(0.2989).add(g.mul(0.587)).add(b.mul(0.114)).cast("float32") as tf.Tensor4D
	const imgTensor = science.toFloat();

	/** Segmentar la imagen */
	/** Coordenadas X medias a lo largo de toda la imagen de SCIENCE */
	const xpoints = findXspacedPoints(width, countCheckpoints);
	/** Segmentos medios de imagen de SCIENCE */
	const boxIdx = tf.tensor1d(new Array(countCheckpoints).fill(0), "int32");
	const cropSize: [number, number] = [height, segmentWidth];
	const boxesVals = xpoints.map((x) => {
		const start = Math.max(0, x - Math.floor(segmentWidth / 2));
		const end = Math.min(width, x + Math.ceil(segmentWidth / 2));
		return [0 / height, start / width, height / height, end / width];
	});
	const boxes = tf.tensor2d(boxesVals, [countCheckpoints, 4], "float32");
	
	let segments = tf.image.cropAndResize(
		imgTensor,
		boxes,
		boxIdx,
		cropSize,
		"nearest",
	); // [countCheckpoints, height, segmentWidth, 1]
	segments = segments.squeeze(); // Quita dimension de canal (countCheckpoints, height, segmentWidth)

	/**
	 * Funciones de cada segmento promediado horizontalmente
	 * Osea, para cada pixel vertical se hace un avg de los pixeles
	 * horizontales. x=>pixelVertical, y=>avgHorizontal
	 */
	const avgTensor = segments.mean(2); // 2 corresponde a widht, (countCheckpoints, segmentCount, height)

	/** Normalizar min-max por fila*/
	const min = avgTensor.min(1, true);
	const max = avgTensor.max(1, true);
	const avgNormalized = avgTensor.sub(min).div(max.sub(min));

	/** Pronunciar las tendencias presentes en la funcion. */
	const umbral = 0.5;
	const greaterMask = avgNormalized.greater(tf.scalar(umbral));
	const ones = tf.onesLike(avgTensor);
	const zeros = tf.zerosLike(avgTensor);
	const pushed = ones.where(greaterMask, zeros);

	/** Suavizar para eliminar baches pequeños. */
	let window = Math.round(height * 0.15);
	window = window % 2 === 1 ? window : window + 1;
	const k = tf.tensor3d(Array(window).fill(1 / window), [window, 1, 1]);
	const pushed_smoothed = pushed.expandDims(2).conv1d(k, 1, "same").squeeze();

	/**
	 * Arreglo con informacion de para cada funcion de un segmento el
	 * punto vertical medio y la apartura que le corresponde.
	 */
	const avgArrs: number[][] = pushed_smoothed.arraySync() as number[][];
	const plateauInfo: {
		medium: number;
		opening: number;
	}[] = avgArrs.map((arr: number[]) => findPlateau(arr, umbral));

	// /** Guardar grafico de funciones */
	// const i = 0;
	// const original = avgTensor.slice([i, 0], [1, height]).dataSync();
	// const original_smoothed = weightedSmooth(Array.from(original), window);
	// const original_pushed = pushed.slice([i, 0], [1, height]).squeeze();
	// const original_pushed_smoothed = pushed_smoothed
	// 	.slice([i, 0], [1, height])
	// 	.squeeze();
	// guardarFuncion(
	// 	[
	// 		Array.from(original),
	// 		//original_smoothed,
	// 		Array.from(original_pushed.dataSync()),
	// 		original_pushed_smoothed.arraySync() as number[],
	// 	],
	// 	`function${i}.png`,
	// 	plateauInfo[i].medium,
	// 	umbral,
	// 	[
	// 		"blue", //"skyblue",
	// 		"yellow",
	// 		"orange",
	// 	],
	// );

	/** Apertura promedio */
	const avgOpening =
		(plateauInfo.reduce((sum, pi) => sum + pi.opening, 0) /
			plateauInfo.length) *
		1; // 0.9 margen para evitar bordes

	/**
	 * Conjuntos de cordenadas (x,y) de los puntos que trazan la recta
	 * media de la función.
	 */
	const mediasPoints = xpoints.map((point, index) => ({
		x: point,
		y: plateauInfo[index].medium,
	}));

	// Infiere funcion medio del espectro
	const interpolated: {
		funct: (x: number) => number;
		derived: (x: number) => number;
	} =
		fitFunction === "spline"
			? splineCuadratic(
					xpoints,
					mediasPoints.map((p) => p.y),
				)
			: linearRegressionWhitDerived(
					xpoints,
					mediasPoints.map((p) => p.y),
				);

	// /** Conseguir valores perpendiculares a promediar en cada punto */
	// function demo() {
	// 	//
	// 	// const xVals = tf.range(0, width, 1, "int32");
	// 	// const yVals = tf.tensor1d(
	// 	// 	xVals.arraySync().map((x) => interpolated.funct(x)),
	// 	// );
	// 	// const sourceVals = tf.stack([xVals, yVals]);
	// 	// const mVals = tf.tensor1d(
	// 	// 	xVals.arraySync().map((x) => interpolated.derived(x)),
	// 	// );
	// 	// const angles = mVals.atan();
	// 	// const anglesDeg = angles.mul(180 / Math.PI); // HAberiguar si es con angulos o radianes
	// 	// const cos = angles.cos();
	// 	// const sin = angles.sin();
	// 	// const rotationMatrices = tf.stack(
	// 	// 	[
	// 	// 		tf.stack([cos, sin.neg()], 1), // fila 1: [cos, -sin]
	// 	// 		tf.stack([sin, cos], 1), // fila 2: [sin, cos]
	// 	// 	],
	// 	// 	1,
	// 	// );
	// 	// const n = Math.floor(avgOpening);
	// 	// let points = tf.stack([tf.linspace(-n / 2, n / 2, n), tf.zeros([n])], 1);
	// 	// points = points.expandDims(0).tile([width, 1, 1]); // [n, n, 2]
	// 	// // const rotatedPoints = tf.matMul(points, rotationMatrices); // [N, n, 2]
	// 	// // rotatedPoints = rotatedPoints.add(sourceVals.transpose().expandDims(1));
	// 	const xvals = tf.tensor1d([-2, -1, 0, 1, 2]);
	// 	const yvals = tf.tensor1d([0, 0, 0, 0, 0]);
	// 	const sourceVals = tf.stack([xVals, yVals]);

	// 	guardarRectaYPuntos(sourceVals.arraySync() as [number, number][], {
	// 		b: 0,
	// 		m: 0.5,
	// 	});
	// }
	// demo();

	/** Promedio de pixeles que pasan por cada scienceTransversalFunction. Solo funciona con regresion lineal*/
	// imgTensor: [1, height, width, 1]  — escala de grises en 4D
	const gray2d = imgTensor.squeeze([0, 3]); // [height, width]
	/** Valores por pixel horizontal en eje X e Y */
	const xValues = tf.range(0, width, 1, "int32").arraySync();
	const yvalues = tf.tensor1d(xValues.map((x) => interpolated.funct(x)));
	/** Minimo Y por pixel */
	const minYs = yvalues.sub(tf.scalar(avgOpening / 2));
	/** Maximo Y por pixel */
	const maxYs = yvalues.add(tf.scalar(avgOpening / 2));
	/** Tensor de coordenadas verticales: shape [height, width] => [0, 1, 2, ..., height-1]*/
	const rowIndices = tf.range(0, height, 1, "int32");
	const rowMatrix = tf.tile(rowIndices.expandDims(1), [1, width]);
	/** Filtrar valores por columna que no entran entre el min y max de la columna */
	const maskLower = rowMatrix.greater(minYs);
	const maskUpper = rowMatrix.less(maxYs);
	const fullMask = tf.logicalAnd(maskLower, maskUpper);
	const imgMasked = tf.where(fullMask, gray2d, tf.fill([height, width], 0));
	/** Rotar para que la pendiente quede horizontal */
	const rad = Math.atan(interpolated.derived(0));
	const imgMaskedRotated = tf.image
		.rotateWithOffset(
			imgMasked.expandDims(0).expandDims(-1) as tf.Tensor4D,
			rad,
			0,
			[0.5, 0.5],
		)
		.squeeze([0, 3]);
	const fullMaskRotated = tf.image
		.rotateWithOffset(
			fullMask.toFloat().expandDims(0).expandDims(-1) as tf.Tensor4D,
			rad,
			0,
			[0.5, 0.5],
		)
		.toInt()
		.squeeze([0, 3]);
	
	/** Promediar por columna */
	const validPerColumn = fullMaskRotated.cast("int32").sum(0);
	const avgPerColumn = imgMaskedRotated.sum(0).div(validPerColumn);

	return {
		mediasPoints: mediasPoints,
		opening: avgOpening,
		rectFunction: interpolated.funct,
		transversalAvgs: avgPerColumn.arraySync() as number[],
		spectrumMask: fullMask.expandDims(0).expandDims(-1),
	};
}