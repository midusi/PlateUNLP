import { useMap } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	extractFeatures,
	type extractFeaturesResponse,
	extractScience,
	type extractScienceResponse,
} from "~/lib/extract-features";
import { crop, loadImage, obtainimageMatrix } from "~/lib/image";
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

	const [science, setScience] = useState<Uint8Array>();
	const [lamp1, setLamp1] = useState<Uint8Array>();
	const [lamp2, setLamp2] = useState<Uint8Array>();
	const [scienceAnalysis, setScienceAnalysis] =
		useState<extractScienceResponse>();
	const [specAnalysis, setSpecAnalysis] =
		useState<extractFeaturesResponse<Uint8ClampedArray<ArrayBufferLike>>>();
	const [state, setState] = useState<"waiting" | "running" | "ready">(
		"waiting",
	);

	const [observationImage, setObservationImage] =
		useState<HTMLImageElement | null>(null);

	// Crop and save the spectrum image to be analyzed
	const [spectrumsData, setSpectrumsData] = useState<
		(Spectrum & { data: Uint8Array })[]
	>([]);
	useEffect(() => {
		if (!observationImage) {
			loadImage(`/observation/${observationId}/image`).then((image) =>
				setObservationImage(image),
			);
			return;
		}

		let first = true;
		for (const spectrum of spectrums) {
			const saved = spectrumsData.find((s) => s.id === spectrum.id);
			if (
				saved &&
				spectrum.type === saved.type &&
				spectrum.imgTop === saved.imgTop &&
				spectrum.imgLeft === saved.imgLeft &&
				spectrum.imgWidth === saved.imgWidth &&
				spectrum.imgHeight === saved.imgHeight
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
			setSpectrumsData((prev) =>
				[
					...prev.filter((s) => s.id !== spectrum.id),
					{ ...spectrum, data },
				].sort((a, b) => a.imgTop - b.imgTop || a.imgLeft - b.imgLeft),
			);
			if (first) {
				setScience(data);
				const result = extractScience({
					science: data,
					width: spectrum.imgWidth,
					height: spectrum.imgHeight,
					countCheckpoints,
					segmentWidth: segmentWidth,
					fitFunction: "linal-regression",
				});
				setScienceAnalysis(result);
				setState("ready");
				console.log(result);
				first = false;
			}
		}
	}, [observationId, observationImage, spectrums, spectrumsData]);

	//  useEffect(() => {
	//    /** Si no hay suficientes espectros o el id de observacion no hace nada */
	//    if (!observationId || spectrums.length < 3) {
	//      setState("waiting")
	//      return
	//    }
	//    setState("running")
	//    const run = async () => {
	//      /** Imagen de espectro de ciencia */
	//      const science = await obtainimageMatrix(`/spectrum/${spectrums[0].id}/image`)
	//      setScience(science.data)
	//      /** Imagen de espectro de lampara de comparación 1 */
	//      const lamp1 = await obtainimageMatrix(`/spectrum/${spectrums[1].id}/image`)
	//      setLamp1(lamp1.data)
	//      /** Imagen de espectro de lampara de comparación 2 */
	//      const lamp2 = await obtainimageMatrix(`/spectrum/${spectrums[2].id}/image`)
	//      setLamp2(lamp2.data)
	//
	//      /** Extraer caracteristicas de ciencia
	//       * [specrum[0]] -> science
	//       */
	//      /** Extraer caracteristicas de lamp1
	//       * [spectrum[1], science] -> lamp1
	//       */
	//
	//      /** Extraer caracteristicas de lamp2
	//       * [spectrum[2], science] -> lamp2
	//       */
	//
	//      /** Extraer caracteristicas en base a las imagenes de los espectros. */
	//      const spectrumAnalysis = extractFeatures(
	//        countCheckpoints,
	//        segmentWidth,
	//        science,
	//        lamp1,
	//        lamp2,
	//        useSpline,
	//        reuseScienceFunction,
	//      )
	//
	//      /** Actualizar variables superiores */
	//      setSpecAnalysis(spectrumAnalysis)
	//      setState("ready")
	//    }
	//
	//    run()
	//
	//    /** Funcion de Limpieza */
	//    return () => {}
	//  }, [observationId, spectrums])

	return (
		<Card>
			<CardContent>
				{state === "waiting" && <span>Waiting definition of spectrums</span>}
				{state === "running" && (
					<span className={cn("icon-[ph--spinner-bold] animate-spin")} />
				)}
				{state === "ready" && (
					<>
						{scienceAnalysis && (
							<>
								<ImageWithPixelExtraction
									title="Science Spectrum"
									src={`/spectrum/${spectrums[0].id}/image`}
									imageAlt="Pixel-by-pixel analysis of science spectrum to extract spectrum function."
									pointsWMed={scienceAnalysis!.mediasPoints}
									drawFunction={scienceAnalysis!.rectFunction}
									opening={scienceAnalysis!.opening}
								/>
								<SimpleFunctionXY data={scienceAnalysis!.transversalAvgs} />
							</>
						)}

						{/* <ImageWithPixelExtraction
							title="Lamp 1 Spectrum"
							src={`/spectrum/${spectrums[1].id}/image`}
							imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 1."
							pointsWMed={specAnalysis!.lamp1MediasPoints}
							drawFunction={specAnalysis!.lamp1Function!}
							perpendicularFunctions={specAnalysis!.lamp1TransversalFunctions}
							opening={specAnalysis!.lamp1AvgOpening}
						/>
						<SimpleFunctionXY data={specAnalysis!.lamp1TransversalAvgs} />
						<ImageWithPixelExtraction
							title="Lamp 2 Spectrum"
							src={`/spectrum/${spectrums[2].id}/image`}
							imageAlt="Pixel-by-pixel inference of the scientific spectrum of comparison lamp 2."
							pointsWMed={specAnalysis!.lamp2MediasPoints}
							drawFunction={specAnalysis!.lamp2Function!}
							perpendicularFunctions={specAnalysis!.lamp2TransversalFunctions}
							opening={specAnalysis!.lamp2AvgOpening}
						/>
						<SimpleFunctionXY data={specAnalysis!.lamp2TransversalAvgs} /> */}
					</>
				)}
				{/* {isLoading || !specAnalysis ? (
          <></>
        ) : (          
          <div className="flex flex-col content-center justify-center gap-4">
            <div id="Spectrum-Extracted-Science">
              <ImageWithPixelExtraction
                title="Science Spectrum"
                image={science!}
                imageAlt="Pixel-by-pixel analysis of science spectrum to extract spectrum function."
                pointsWMed={specAnalysis.scienceMediasPoints}
                drawFunction={specAnalysis.scienceFunction!}
                perpendicularFunctions={specAnalysis.scienceTransversalFunctions}
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
        )} */}
			</CardContent>
		</Card>
	);
}
