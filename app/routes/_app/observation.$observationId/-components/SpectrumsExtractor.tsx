import { useRouter } from "@tanstack/react-router";
import type * as tf from "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";
import type z from "zod";
import { ImageWithPixelExtraction } from "~/components/ImageWithPixelExtraction";
import { SimpleFunctionXY } from "~/components/SimpleFunctionXY";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "~/components/ui/card";
import { useAppForm } from "~/hooks/use-app-form";
import type { extractSpectrumResponse } from "~/lib/extract-features";
import { notifyError } from "~/lib/notifications";
import { ExtractionConfigurationSchema } from "~/types/spectrum-metadata";
import { getObservationExtractionConfiguration } from "../-actions/get-observation-extraction-configuration";
import type { getSpectrums } from "../-actions/get-spectrums";
import { updateObservationExtractionConfiguration } from "../-actions/update-observation-extraction-configuration";
import { updateSpectrumsIntensityArr } from "../-actions/update-spectrums-intensity-arr";
import { updateSpectrumsTypes } from "../-actions/update-spectrums-types";
import { recalculateSpectrums1D } from "../-utils/recalculate-spectrums-1d";
import { toRecalculate } from "../-utils/to-recalculate";

interface Spectrum {
	id: string;
	type: "lamp" | "science";
	imageWidth: number;
	imageHeight: number;
	imageLeft: number;
	imageTop: number;
}

type SpectrumsExtractorProps = {
	/** Id de la observacion */
	observationId: string;
	/** Arreglo con especificaciones de espectros de la observacion */
	spectrums: Awaited<ReturnType<typeof getSpectrums>>;
	/** Tensor 2D que representa la imagen recibida en escala de grises */
	observationTensor: tf.Tensor2D;
};

export function SpectrumsExtractor({
	observationId,
	spectrums = [],
	observationTensor,
}: SpectrumsExtractorProps) {
	const orderedSpectrums = spectrums.sort(
		(a, b) => a.imageTop - b.imageTop || a.imageLeft - b.imageLeft,
	);
	/** Valores iniciales para el formulario de extraccion */
	const defaultValues: z.output<typeof ExtractionConfigurationSchema> = {
		countMediasPoints: 5,
		apertureCoefficient: 1,
		spectrums: orderedSpectrums,
	};

	/** Estado del procesado */
	const [state, setState] = useState<"ready" | "running">("running");
	/** Almacenar informacion de si las variables estan listas */
	const [analysisArr, setAnalysisArr] = useState<
		{ id: string; analysis: extractSpectrumResponse }[]
	>([]);

	/** Registro temporal de valores previos */
	const prevFormValues = useRef<{
		countMediasPoints: number;
		apertureCoefficient: number;
		spectrums: Spectrum[];
		idPrincipalSpectrum: string;
	}>({
		countMediasPoints: 0,
		apertureCoefficient: 0,
		spectrums: [],
		idPrincipalSpectrum:
			orderedSpectrums.find((s) => s.type === "science")?.id ?? "",
	});

	const form = useAppForm({
		/** Se usa la configuracion del 1er espectro */
		defaultValues: defaultValues,
		validators: {
			onMount: ExtractionConfigurationSchema,
			onChange: ExtractionConfigurationSchema,
		},
		onSubmit: async ({ value, formApi: _formApi }) => {
			try {
				setState("running");
				/** Averiguar que espectros del listado deben ser recalculados */
				const {
					recalculateArr,
					changeMediasPoints,
					changeApertureCoefficient,
					changePrincipalSpectrum,
					idPrincipalSpectrum,
				} = toRecalculate(value, prevFormValues.current);

				/** Realizar analisis */
				let newAnalysis: {
					id: string;
					analysis: extractSpectrumResponse;
				}[] = [];
				if (recalculateArr.length > 0) {
					newAnalysis = recalculateSpectrums1D(
						observationTensor,
						recalculateArr,
						prevFormValues.current.spectrums,
						idPrincipalSpectrum,
						value.countMediasPoints,
						value.apertureCoefficient,
						analysisArr,
					);
					/** Actualizar informacion de analisis guardada en estado */
					const newAnalysisArr = analysisArr
						.filter(
							(a) =>
								value.spectrums.some((s) => a.id === s.id) &&
								newAnalysis.every((s) => a.id !== s.id),
						)
						.concat(newAnalysis);
					analysisArr /** Olvidar tensores de espectros que ya no se usan */
						.filter((a) => value.spectrums.every((s) => a.id !== s.id))
						.forEach((s) => s.analysis.spectrumMask.dispose());
					setAnalysisArr(newAnalysisArr);
				}

				if (changeMediasPoints || changeApertureCoefficient) {
					/** Actualizar parametros de extraccion de la observacion */
					await updateObservationExtractionConfiguration({
						data: {
							observationId: observationId,
							countMediasPoints: changeMediasPoints
								? value.countMediasPoints
								: undefined,
							apertureCoefficient: changeApertureCoefficient
								? value.apertureCoefficient
								: undefined,
						},
					});
				}

				/** Si los parametros de extraccion de la observacion cambiaron los actualiza */
				await updateObservationExtractionConfiguration({
					data: {
						observationId: observationId,
						countMediasPoints: value.countMediasPoints,
						apertureCoefficient: value.apertureCoefficient,
					},
				});

				/** Si los tipos de los espectros cambiaron los actualiza */
				if (changePrincipalSpectrum) {
					let typesWhoChanged: Spectrum[];
					if (prevFormValues.current.spectrums.length <= 0)
						typesWhoChanged = value.spectrums;
					else
						typesWhoChanged = value.spectrums.filter(
							(s, idx) => s.type !== prevFormValues.current.spectrums[idx].type,
						);
					await updateSpectrumsTypes({ data: typesWhoChanged });
				}
				/** Si cambio el arreglo de intensidades de un espectro se actualiza */
				if (newAnalysis.length > 0)
					await updateSpectrumsIntensityArr({
						data: newAnalysis.map((a) => ({
							id: a.id,
							intensityArr: a.analysis.transversalAvgs,
						})),
					});

				/** Actualizar registros para detectar futuros cambios */
				if (changeMediasPoints)
					prevFormValues.current.countMediasPoints = value.countMediasPoints;
				if (changeApertureCoefficient)
					prevFormValues.current.apertureCoefficient =
						value.apertureCoefficient;
				if (changePrincipalSpectrum)
					prevFormValues.current.idPrincipalSpectrum = idPrincipalSpectrum;
				prevFormValues.current.spectrums = value.spectrums;

				/** Avisar fin del procesado */
				setState("ready");
				//router.invalidate();
				// formApi.reset(value);
				console.log(5);
			} catch (error) {
				if (
					error instanceof Error &&
					error.message !== "The main spectrum is not specified"
				) {
					notifyError(
						"Failed to update spectrum extraction configuration",
						error,
					);
				}
			}
		},
		listeners: {
			onMount: async ({ formApi }) => {
				try {
					const result = await getObservationExtractionConfiguration({
						data: { observationId },
					});
					if (!result) {
						notifyError("The required observation does not exist", "");
					}
					formApi.setFieldValue("countMediasPoints", result.countMediasPoints);
					formApi.setFieldValue(
						"apertureCoefficient",
						result.apertureCoefficient,
					);
					formApi.handleSubmit();
				} catch (error) {
					notifyError(
						"Something happens bad with database interactionSomething went wrong with the interaction with the database.",
						error,
					);
				}
			},
			onChange: ({ formApi }) => {
				/** Si el formulario es valido realiza Submit para autoguardado */
				if (formApi.state.isValid) {
					formApi.handleSubmit();
				}
			},
			/**
			 * Retrazar la actualizacion de cambios por lo menos 500 ml de
			 * la ultima modificacion del usuario del formulario
			 */
			onChangeDebounceMs: 500,
		},
	});

	useEffect(() => {
		form.setFieldValue("spectrums", orderedSpectrums);
		form.handleSubmit();
	}, [orderedSpectrums, form.setFieldValue, form.handleSubmit]);

	return (
		<Card>
			<CardHeader>
				<div id="spectrum-extraction-controls" className="flex gap-10">
					<form.AppField name="countMediasPoints">
						{(field) => (
							<field.RangeField
								label="Count checkpoints"
								//disabled={state !== "ready"}
								min={2}
								max={20}
								step={1}
							/>
						)}
					</form.AppField>
					<form.AppField name="apertureCoefficient">
						{(field) => (
							<field.RangeField
								label="Aperture Percentage"
								//disabled={state !== "ready"}
								min={0.7}
								max={1.3}
								step={0.1}
							/>
						)}
					</form.AppField>
				</div>
				<hr />
			</CardHeader>
			<CardContent
				className="flex items-center justify-center"
				style={{ minHeight: "400px" }}
			>
				{state === "running" ? (
					<span className="icon-[ph--cloud-arrow-up-bold] ml-1 size-3" />
				) : (
					<form.Field name="spectrums" mode="array">
						{(spectrumsField) => {
							const spectrumsArr = spectrumsField.state.value;
							const scienceCount = spectrumsArr.filter(
								(s) => s.type === "science",
							).length;
							return (
								<div className="flex flex-col gap-4">
									{!spectrumsArr.length
										? "Waiting definition of spectrums"
										: spectrumsArr.map((item, idx) => (
												<form.Field key={item.id} name={`spectrums[${idx}]`}>
													{(field) => {
														const st = field.state.value;
														const spec = spectrums.find((s) => s.id === st.id);
														if (!spec) {
															return "Spectrum image not found";
														}
														const analysis = analysisArr.find(
															(a) => a.id === st.id,
														)?.analysis;
														if (!analysis)
															return "Spectrum analysis data not found";
														const analysisPrincipal = analysisArr.find(
															(a) =>
																a.id ===
																prevFormValues.current.idPrincipalSpectrum,
														)?.analysis;
														if (!analysisPrincipal)
															return "Principal spectrum analysis data not found";
														return (
															<div>
																<div className="flex w-full flex-row items-center justify-center gap-2 font-semibold text-lg text-slate-500">
																	<h3 className="flex justify-center ">{`Spectrum ${idx} [`}</h3>
																	<select
																		value={st.type}
																		className="rounded-lg bg-gray-100"
																		style={{
																			textAlign: "center",
																			textAlignLast: "center",
																		}}
																		onChange={(e) => {
																			const selectedValue = e.target.value as
																				| "lamp"
																				| "science";
																			if (st.type === selectedValue) return;

																			if (selectedValue === "lamp") {
																				field.handleChange({
																					...st,
																					id: st.id,
																					type: "lamp",
																				});
																			} else {
																				const delOtherScience = [
																					...spectrumsArr,
																				].map((sty) => ({
																					...sty,
																					id: sty.id,
																					type:
																						sty.id === st.id
																							? ("science" as const)
																							: ("lamp" as const),
																				}));

																				spectrumsField.handleChange(
																					delOtherScience,
																				);
																			}
																		}}
																		onBlur={field.handleBlur}
																	>
																		<option value={"science"}>Science</option>
																		<option
																			value={"lamp"}
																			disabled={
																				scienceCount >= 1 &&
																				st.type === "science"
																			}
																			className="disabled:cursor-not-allowed disabled:text-gray-400"
																		>
																			Comparison Lamp
																		</option>
																	</select>
																	<h3 className="flex justify-center ">{`]`}</h3>
																</div>
																<ImageWithPixelExtraction
																	image={{
																		url: `/observation/${observationId}/preview`,
																		width: spec.imageWidth,
																		height: spec.imageHeight,
																		top: spec.imageTop,
																		left: spec.imageLeft,
																	}}
																	pointsWMed={analysis.mediasPoints}
																	drawFunction={analysisPrincipal.rectFunction}
																	opening={analysisPrincipal.opening}
																/>
																<SimpleFunctionXY
																	data={analysis.transversalAvgs}
																/>
															</div>
														);
													}}
												</form.Field>
											))}
								</div>
							);
						}}
					</form.Field>
				)}
			</CardContent>
			<CardFooter className="flex justify-end">
				<form.Subscribe
					selector={(formState) => [formState.isValid, formState.isSubmitting]}
				>
					{([isValid, isSubmitting, isDirty]) => (
						<p className="flex items-center text-muted-foreground text-xs italic">
							{!isValid ? (
								<>
									<span>
										Changes aren't beign saved! Please fix the errors above
									</span>
									<span className="icon-[ph--warning-circle-bold] ml-1 size-3" />
								</>
							) : isSubmitting || isDirty ? (
								<>
									<span>Calculating spectral vectors...</span>
									<span className="icon-[ph--spinner-bold] ml-1 size-3 animate-spin" />
								</>
							) : (
								<>
									<span>Extraction configuration saved on database</span>
									<span className="icon-[ph--cloud-arrow-up-bold] ml-1 size-3" />
								</>
							)}
						</p>
					)}
				</form.Subscribe>
			</CardFooter>
		</Card>
	);
}
