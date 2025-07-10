import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import sharp from "sharp";
import { Card, CardContent } from "~/components/ui/card";
import { db } from "~/db";
import { readUploadedFile } from "~/lib/uploads";
import { cn } from "~/lib/utils";
import type { getSpectrums } from "../-actions/get-spectrums";
import {
	useExtractFeatures,
	type useExtractFeaturesResponse,
} from "../-hooks/use-extract-features";
import { ImageWithPixelExtraction } from "./ImageWithPixelExtraction";
import { SimpleFunctionXY } from "./SimpleFunctionXY";

export function SpectrumsFeatures({
	observationId,
	spectrums,
}: {
	observationId: string;
	spectrums: Awaited<ReturnType<typeof getSpectrums>>;
}) {
	const countCheckpoints = 5;
	const segmentWidth = 60;
	const useSpline = false;
	const reuseScienceFunction = true;

	const { data, isLoading, error } = useQuery({
		queryKey: ["spectral-images", observationId, spectrums],
		queryFn: async () => {
			/** Recuperar imagen de la placa enlazada a la observación. */
			const observation = await db.query.observation.findFirst({
				where: (t, { eq }) => eq(t.id, observationId),
				with: { plate: { with: { image: true } } },
			});
			if (!observation) throw new Error("Not found");
			const plate = await readUploadedFile(observation.plate.image.id);
			/** Imagenes de los espectros */
			const images = await Promise.all(
				spectrums.map(
					async (s) =>
						await sharp(plate)
							.extract({
								height: Math.round(s.imgHeight),
								top: Math.round(s.imgTop),
								left: Math.round(s.imgLeft),
								width: Math.round(s.imgWidth),
							})
							.toBuffer(),
				),
			);
			return images;
		},
	});

	const [science, setScience] = useState<Buffer<ArrayBufferLike>>();
	const [lamp1, setLamp1] = useState<Buffer<ArrayBufferLike>>();
	const [lamp2, setLamp2] = useState<Buffer<ArrayBufferLike>>();
	const [specAnalysis, setSpecAnalysis] =
		useState<useExtractFeaturesResponse<Buffer<ArrayBufferLike>>>();

	useEffect(() => {
		/** Si esta cargando retorna */
		if (isLoading) return;
		/** Si no hay respeuesta de imagens retorna */
		if (!data) return;
		/** Si faltan imagenes retorna */
		if (data.length < 3) return;

		/** Separa imagenes de cada espectro */
		/** Imagen de espectro de ciencia */
		const science = data[0];
		/** Imagen de espectro de lampara de comparación 1 */
		const lamp1 = data[1];
		/** Imagen de espectro de lampara de comparación 2 */
		const lamp2 = data[2];

		/** Extraer caracteristicas en base a las imagenes de los espectros. */
		const spectrumAnalysis = useExtractFeatures(
			countCheckpoints,
			segmentWidth,
			science,
			lamp1,
			lamp2,
			useSpline,
			reuseScienceFunction,
		);

		/** Actualizar variables superiores */
		setScience(science);
		setLamp1(lamp1);
		setLamp2(lamp2);
		setSpecAnalysis(spectrumAnalysis);

		/** Funcion de Limpieza */
		return () => {};
	}, [
		data,
		spectrums,
		isLoading,
		setSpecAnalysis,
		setScience,
		setLamp1,
		setLamp2,
	]);

	return (
		<Card>
			<CardContent>
				{isLoading || !specAnalysis ? (
					<span className={cn("icon-[ph--spinner-bold] animate-spin")} />
				) : (
					<div className="flex flex-col justify-center content-center gap-4">
						<div id="Spectrum-Extracted-Science">
							<ImageWithPixelExtraction
								title="Science Spectrum"
								image={science!}
								imageAlt="Pixel-by-pixel analysis of science spectrum to extract spectrum function."
								pointsWMed={specAnalysis.scienceMediasPoints}
								drawFunction={specAnalysis.scienceFunction!}
								perpendicularFunctions={
									specAnalysis.scienceTransversalFunctions
								}
								opening={specAnalysis.scienceAvgOpening}
							/>
							<SimpleFunctionXY data={specAnalysis.scienceTransversalAvgs} />
						</div>

						<div id="Spectrum-Extracted-Lamp1">
							<ImageWithPixelExtraction
								title="Lamp 1 Spectrum"
								image={lamp1!}
								imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 1."
								pointsWMed={specAnalysis.lamp1MediasPoints}
								drawFunction={specAnalysis.lamp1Function!}
								perpendicularFunctions={specAnalysis.lamp1TransversalFunctions}
								opening={specAnalysis.lamp1AvgOpening}
							/>
							<SimpleFunctionXY data={specAnalysis.lamp1TransversalAvgs} />
						</div>

						<div id="Spectrum-Extracted-Lamp2">
							<ImageWithPixelExtraction
								title="Lamp 2 Spectrum"
								image={lamp2!}
								imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 2."
								pointsWMed={specAnalysis.lamp2MediasPoints}
								drawFunction={specAnalysis.lamp2Function!}
								perpendicularFunctions={specAnalysis.lamp2TransversalFunctions}
								opening={specAnalysis.lamp2AvgOpening}
							/>
							<SimpleFunctionXY data={specAnalysis.lamp2TransversalAvgs} />
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
