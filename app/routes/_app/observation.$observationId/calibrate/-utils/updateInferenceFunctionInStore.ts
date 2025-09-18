import { CustomError } from "~/lib/utils";
import type { Point } from "~/types/Point";

export interface InferenceOption {
	id: number;
	name: string;
	funct: (
		x: number[],
		y: number[],
		degree?: number,
	) => (value: number) => number;
	needDegree: boolean;
}

export function updateInferenceFuntionInStore(
	funtionOption: InferenceOption,
	deegre: number,
	lampPoints: Point[],
	materialPoints: Point[],
	updateFunction: (arr: ((value: number) => number) | CustomError) => void,
) {
	const matches = [];
	const smallArr =
		lampPoints.length >= materialPoints.length ? materialPoints : lampPoints;
	for (let i = 0; i < smallArr.length; i++) {
		matches.push({ lamp: lampPoints[i], material: materialPoints[i] });
	}

	/** Actualiza la funcion que se usa para inferir las longitudes de onda de los espectros */
	try {
		const inferenceFunction = funtionOption.funct(
			matches.map((val) => val.lamp.x),
			matches.map((val) => val.material.x),
			funtionOption.needDegree ? deegre : undefined,
		);
		updateFunction(inferenceFunction);
	} catch (error) {
		if (error instanceof CustomError) {
			updateFunction(error);
		} else {
			throw error;
		}
	}
}
