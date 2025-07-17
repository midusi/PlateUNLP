import { useEffect, useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import {
	extractLamp,
	extractScience,
	type extractSpectrumResponse,
} from "~/lib/extract-features";
import { loadImage } from "~/lib/image";
import { notifyError } from "~/lib/notifications";
import { cn } from "~/lib/utils";
import { ImageWithPixelExtraction } from "../../../../components/ImageWithPixelExtraction";
import { SimpleFunctionXY } from "../../../../components/SimpleFunctionXY";
import type { getSpectrums } from "../-actions/get-spectrums";
import type { Spectrum } from "../-utils/spectrum-to-bounding-box";

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

	const [scienceAnalysis, setScienceAnalysis] = useState<{
		width: number;
		height: number;
		analysis: extractSpectrumResponse;
	}>();
	const [state, setState] = useState<"waiting" | "running" | "ready">(
		"waiting",
	);

	const [observationImage, setObservationImage] =
		useState<HTMLImageElement | null>(null);

	// Crop and save the spectrum image to be analyzed
	const [spectrumsData, setSpectrumsData] = useState<
		{
			data: Spectrum;
			image: Uint8Array;
			analysis: extractSpectrumResponse;
		}[]
	>([]);
	useEffect(() => {
		if (!observationImage) {
			loadImage(`/observation/${observationId}/image`).then((image) =>
				setObservationImage(image),
			);
			return;
		}
		if (spectrums.length === 0) return;

		/** Coloca primero el espectro de ciencia */
		const indexSpectrum = spectrums.findIndex((s) => s.type === "science");
		console.log(spectrums);
		console.log(indexSpectrum);
		const specScience = spectrums[indexSpectrum];
		console.log(indexSpectrum);
		spectrums[indexSpectrum].type = "science";
		const spectrumsArr = [...spectrums];
		spectrumsArr.splice(indexSpectrum, 1);
		spectrumsArr.unshift(specScience);
		let scienceInfo:
			| {
					width: number;
					height: number;
					analysis: extractSpectrumResponse;
			  }
			| undefined = scienceAnalysis && scienceAnalysis;

		for (const spectrum of spectrumsArr) {
			const saved = spectrumsData.find((s) => s.data.id === spectrum.id);
			if (
				saved &&
				spectrum.type === saved.data.type &&
				spectrum.imgTop === saved.data.imgTop &&
				spectrum.imgLeft === saved.data.imgLeft &&
				spectrum.imgWidth === saved.data.imgWidth &&
				spectrum.imgHeight === saved.data.imgHeight
			) {
				continue;
			}

			const canvas = document.createElement("canvas");
			canvas.width = spectrum.imgWidth;
			canvas.height = spectrum.imgHeight;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				notifyError("Failed to create canvas context for spectrum image.");
				return;
			}
			ctx.filter = "grayscale(1)";
			ctx.drawImage(
				observationImage,
				spectrum.imgLeft,
				spectrum.imgTop,
				spectrum.imgWidth,
				spectrum.imgHeight,
				0,
				0,
				spectrum.imgWidth,
				spectrum.imgHeight,
			);
			const data = new Uint8Array(
				ctx.getImageData(0, 0, spectrum.imgWidth, spectrum.imgHeight, {}).data
					.buffer,
			);
			canvas.remove();

			/** Extraer caracteristicas */
			let result: extractSpectrumResponse;
			if (spectrum.type === "science") {
				result = extractScience({
					science: data,
					width: spectrum.imgWidth,
					height: spectrum.imgHeight,
					countCheckpoints,
					segmentWidth: segmentWidth,
					fitFunction: "linal-regression",
				});
				scienceInfo = {
					width: spectrum.imgWidth,
					height: spectrum.imgHeight,
					analysis: result,
				};
				setScienceAnalysis({ ...scienceInfo });
			} else {
				result = extractLamp({
					science: {
						width: scienceInfo!.width,
						height: scienceInfo!.height!,
						mediasPoints: scienceInfo!.analysis.mediasPoints,
						opening: scienceInfo!.analysis.opening,
						rectFunction: scienceInfo!.analysis.rectFunction,
						transversalAvgs: scienceInfo!.analysis.transversalAvgs,
					},
					lamp: data,
					width: spectrum.imgWidth,
					height: spectrum.imgHeight,
					countCheckpoints,
					segmentWidth: segmentWidth,
					fitFunction: "linal-regression",
				});
			}
			setSpectrumsData((prev) =>
				[
					...prev.filter((s) => s.data.id !== spectrum.id),
					{ data: { ...spectrum }, image: data, analysis: result },
				].sort(
					(a, b) =>
						a.data.imgTop - b.data.imgTop || a.data.imgLeft - b.data.imgLeft,
				),
			);
		}
		setState("ready");
	}, [
		observationId,
		observationImage,
		spectrums,
		spectrumsData.find,
		scienceAnalysis,
	]);

	return (
		<Card>
			<CardContent>
				{state === "waiting" && <span>Waiting definition of spectrums</span>}
				{state === "running" && (
					<span className={cn("icon-[ph--spinner-bold] animate-spin")} />
				)}
				{state === "ready" &&
					spectrumsData &&
					spectrumsData.map((sd, i) => (
						<div key={`Spectrum Analysis ${sd.data.id}`}>
							<ImageWithPixelExtraction
								title={`Spectrum ${i}`}
								image={`/spectrum/${sd.data.id}/image?ts=${Date.now()}`}
								imageAlt="Pixel-by-pixel analysis of spectrum to extract spectrum function."
								pointsWMed={sd.analysis.mediasPoints}
								drawFunction={sd.analysis.rectFunction}
								opening={sd.analysis.opening}
							/>
							<SimpleFunctionXY data={sd.analysis.transversalAvgs} />
						</div>
					))}
			</CardContent>
		</Card>
	);
}
