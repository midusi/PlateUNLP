import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { type BoundingBox, BoundingBoxer } from "~/components/BoundingBoxer";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "~/components/ui/table";
import * as s from "~/db/schema";
import { usePredictBBs } from "~/hooks/use-predict-BBs";
import { notifyError } from "~/lib/notifications";
import { cn, idToColor } from "~/lib/utils";
import { classesSpectrumDetection } from "~/types/BBClasses";
import { addSpectrum } from "../-actions/add-spectrum";
import type { getSpectrums } from "../-actions/get-spectrums";
import { updateSpectrum } from "../-actions/update-spectrum";

type Spectrum = Awaited<ReturnType<typeof getSpectrums>>[number];

function spectrumToBoundingBox(spectrum: Spectrum): BoundingBox {
	return {
		id: spectrum.id,
		name: "",
		color: idToColor(spectrum.id),
		top: spectrum.imgTop,
		left: spectrum.imgLeft,
		width: spectrum.imgWidth,
		height: spectrum.imgHeight,
	};
}

export function SpectrumsList({
	observationId,
	initialSpectrums,
}: {
	observationId: string;
	initialSpectrums: Awaited<ReturnType<typeof getSpectrums>>;
}) {
	const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>(
		initialSpectrums.map(spectrumToBoundingBox),
	);

	const determineBBFunction = usePredictBBs(
		1024,
		"spectrum_part_segmentator.onnx",
		classesSpectrumDetection,
		false,
		0.7,
	);

	const determineBBMut = useMutation({
		mutationFn: async () => {
			/** Obtener predicciones */
			const boundingBoxes = await determineBBFunction(
				`/observation/${observationId}/image`,
			);
			/** Actualizar base de datos */
			const boundingBoxesFormated = await Promise.all(
				boundingBoxes.map(async (bb) => {
					let spectrum = await addSpectrum({ data: { observationId } });
					spectrum = {
						...spectrum,
						imgTop: bb.y,
						imgLeft: bb.x,
						imgWidth: bb.width,
						imgHeight: bb.height,
					};
					await updateSpectrum({
						data: {
							spectrumId: spectrum.id,
							imgTop: spectrum.imgTop,
							imgLeft: spectrum.imgLeft,
							imgWidth: spectrum.imgWidth,
							imgHeight: spectrum.imgHeight,
						},
					});
					return spectrumToBoundingBox(spectrum);
				}),
			);

			const spectrum = await addSpectrum({ data: { observationId } });
			setBoundingBoxes((prev) => [...boundingBoxesFormated, ...prev]);
		},
		onError: (error) => notifyError("Error adding spectrum", error),
	});

	const addSpectrumMut = useMutation({
		mutationFn: async () => {
			const spectrum = await addSpectrum({ data: { observationId } });
			setBoundingBoxes((prev) => [spectrumToBoundingBox(spectrum), ...prev]);
		},
		onError: (error) => notifyError("Error adding spectrum", error),
	});

	return (
		<Card className="p-0 overflow-hidden">
			<CardContent className="grid grid-cols-[1fr_300px] h-[500px] p-0">
				<BoundingBoxer
					imageSrc={`/observation/${observationId}/image`}
					boundingBoxes={boundingBoxes}
					onBoundingBoxChange={(boundingBox) => {
						setBoundingBoxes((prev) =>
							prev.map((box) =>
								box.id === boundingBox.id ? { ...box, ...boundingBox } : box,
							),
						);
					}}
					onBoundingBoxChangeEnd={(boundingBox) => {
						updateSpectrum({
							data: {
								spectrumId: boundingBox.id,
								imgTop: boundingBox.top,
								imgLeft: boundingBox.left,
								imgWidth: boundingBox.width,
								imgHeight: boundingBox.height,
							},
						});
					}}
				/>
				<div className="border-l">
					<CardHeader className="p-2">
						<CardTitle>Spectrums</CardTitle>
						<div className="flex items-center justify-evenly">
							<Button
								size="sm"
								disabled={addSpectrumMut.isPending || determineBBMut.isPending}
								onClick={() => determineBBMut.mutate()}
							>
								<span
									className={cn(
										determineBBMut.isPending
											? "icon-[ph--spinner-bold] animate-spin"
											: "icon-[ph--magic-wand-bold]",
									)}
								/>
								Autodetect
							</Button>
							<Button
								size="sm"
								variant="secondary"
								disabled={addSpectrumMut.isPending || determineBBMut.isPending}
								onClick={() => addSpectrumMut.mutate()}
							>
								<span
									className={cn(
										addSpectrumMut.isPending
											? "icon-[ph--spinner-bold] animate-spin"
											: "icon-[ph--plus-bold]",
									)}
								/>
								Add
							</Button>
						</div>
					</CardHeader>
					<Separator />
					<Table>
						<TableBody>
							{boundingBoxes.map((boundingBox) => (
								<TableRow key={boundingBox.id}>
									<TableCell className="font-medium"></TableCell>
									<TableCell>{boundingBox.name}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
