import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "~/db";
import * as s from "~/db/schema";

export const getOrAddCalibration = createServerFn({ method: "POST" })
	.validator(
		z.object({
			observationId: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		let calibration = await db.query.calibration.findFirst({
			where: (calibration, { eq }) =>
				eq(calibration.observationId, data.observationId),
			columns: {
				id: true,
				observationId: true,
				minWavelength: true,
				maxWavelength: true,
				material: true,
				onlyOneLine: true,
				inferenceFunction: true,
				deegre: true,
				lampPoints: true,
				materialPoints: true,
			},
		});

		/** Si no encuentra calibracion para la observacion la crea */
		if (!calibration)
			[calibration] = await db
				.insert(s.calibration)
				.values({
					observationId: data.observationId,
				})
				.returning({
					id: s.calibration.id,
					observationId: s.calibration.observationId,
					minWavelength: s.calibration.minWavelength,
					maxWavelength: s.calibration.maxWavelength,
					material: s.calibration.material,
					onlyOneLine: s.calibration.onlyOneLine,
					inferenceFunction: s.calibration.inferenceFunction,
					deegre: s.calibration.deegre,
					lampPoints: s.calibration.lampPoints,
					materialPoints: s.calibration.materialPoints,
				});

		return calibration;
	});
