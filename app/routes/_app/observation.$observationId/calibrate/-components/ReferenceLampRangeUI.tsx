import { useRouter } from "@tanstack/react-router";
import clsx from "clsx";
import type { AppFieldExtendedReactFormApi } from "node_modules/@tanstack/react-form/dist/esm/createFormHook";
import { useEffect } from "react";
import type z from "zod";
import { ReferenceLampRange } from "~/components/molecules/ReferenceLampRange";
import type { useAppForm } from "~/hooks/use-app-form";
import { useGlobalStore } from "~/hooks/use-global-store";
import { LAMP_MATERIALS } from "~/lib/spectral-data";
import {
	legendreAlgoritm,
	linearRegression,
	piecewiseLinearRegression,
} from "~/lib/utils";
import type { TeoricalSpectrumConfigSchema } from "~/types/calibrate";
import { updateCalibration } from "../-actions/update-calibration";
import {
	type InferenceOption,
	updateInferenceFuntionInStore,
} from "../-utils/updateInferenceFunctionInStore";
import { ReferenceLampSpectrum } from "./ReferenceLampSpectrum";

export const inferenceOptions: InferenceOption[] = [
	{
		id: 0,
		name: "Linear regresion",
		funct: linearRegression,
		needDegree: false,
	},
	{
		id: 1,
		name: "Piece wise linear regression",
		funct: piecewiseLinearRegression,
		needDegree: false,
	},
	{
		id: 2,
		name: "Legendre",
		funct: legendreAlgoritm,
		needDegree: true,
	},
];

type ReferenceLampRangeUIProps = {
	form: typeof form;
};

export function ReferenceLampRangeUI({ form }: ReferenceLampRangeUIProps) {
	/** Temporal hasta refactorizar toda la seccion de calibracion */
	// useEffect(() => {
	// 	form.setFieldValue("minWavelength", rangeMin);
	// 	form.setFieldValue("maxWavelength", rangeMax);
	// }, [rangeMin, rangeMax, form.setFieldValue]);

	return (
		<>
			<div className="grid grid-cols-1 items-center justify-center gap-4 md:grid-cols-2 ">
				<div className="order-1 md:order-none">
					<form.AppField name="material">
						{(field) => (
							<field.SelectFieldSimple
								label="Material"
								options={[...LAMP_MATERIALS].map((v) => ({
									label: v,
									value: v,
								}))}
							/>
						)}
					</form.AppField>
				</div>
				<div className="order-3 md:order-none">
					<form.AppField name="inferenceFunction">
						{(field) => (
							<field.SelectFieldSimple
								label="Inference Function For Fit"
								options={inferenceOptions.map((v) => ({
									label: v.name,
									value: v.name,
								}))}
							/>
						)}
					</form.AppField>
				</div>
				<div className="order-2 md:order-none">
					<form.AppField name="onlyOneLine">
						{(field) => <field.CheckboxField label="ShowOneLine" />}
					</form.AppField>
				</div>
				<div className="order-4 md:order-none">
					<form.Subscribe selector={(state) => state.values.inferenceFunction}>
						{(inferenceFunction) => {
							const option = inferenceOptions.find(
								(f) => f.name === inferenceFunction,
							);
							const showDegre = option?.needDegree ?? false;
							return (
								<form.AppField name="deegre">
									{(field) => (
										<field.TextField
											label="Deegre"
											type="number"
											className={clsx(
												"text-sm tabular-nums",
												"disabled:cursor-default ",
											)}
											disabled={!showDegre}
										/>
									)}
								</form.AppField>
							);
						}}
					</form.Subscribe>
				</div>
			</div>
			<div className="grid w-full grid-cols-1 gap-4 overflow-hidden md:grid-cols-[1fr_200px] ">
				<div className="col-span-1">
					<ReferenceLampRange
						material={form.getFieldValue("material")}
						minWavelength={form.getFieldValue("minWavelength")}
						setMinWavelength={(min) => {
							form.setFieldValue("minWavelength", min);
							router.invalidate();
						}}
						maxWavelength={form.getFieldValue("maxWavelength")}
						setMaxWavelength={(max) => {
							form.setFieldValue("maxWavelength", max);
							router.invalidate();
						}}
					/>
				</div>
				<div className="hidden md:flex md:flex-col md:justify-center md:gap-2">
					<div className="flex flex-col gap-2">
						<form.AppField name="minWavelength">
							{(field) => (
								<div className="flex items-center gap-1">
									{" "}
									<field.NumberField
										label="Min. wavelength"
										hight_modifier="h-6"
										className={clsx(
											"text-sm tabular-nums",
											"disabled:cursor-default disabled:opacity-100",
										)}
									/>
									<span className="text-gray-500">Å</span>
								</div>
							)}
						</form.AppField>
					</div>
					<div className="flex flex-col gap-2">
						<form.AppField name="maxWavelength">
							{(field) => (
								<div className="flex items-center gap-1">
									{" "}
									<field.NumberField
										label="Max. wavelength"
										hight_modifier="h-6"
										className={clsx(
											"text-sm tabular-nums",
											"disabled:cursor-default disabled:opacity-100",
										)}
									/>
									<span className="text-gray-500">Å</span>
								</div>
							)}
						</form.AppField>
					</div>
				</div>
			</div>
			<ReferenceLampSpectrum
				minWavelength={form.getFieldValue("minWavelength")}
				maxWavelength={form.getFieldValue("maxWavelength")}
				material={form.getFieldValue("material")}
				onlyOneLine={form.getFieldValue("onlyOneLine")}
				materialPoints={form.getFieldValue("materialPoints")}
				lampPoints={form.getFieldValue("lampPoints")}
				setMaterialPoints={(arr: { x: number; y: number }[]) => {
					form.setFieldValue("materialPoints", arr);
					router.invalidate();
				}}
			/>
		</>
	);
}
