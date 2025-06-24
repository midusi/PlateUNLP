import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";
import { SelectObservatory } from "~/components/SelectObservatory";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { db } from "~/db";
import * as s from "~/db/schema";
import { PlateMetadataSchema } from "~/types/spectrum-metadata";

const getInitialValues = createServerFn()
	.validator(z.object({ plateId: z.string() }))
	.handler(async ({ data }) => {
		const plate = await db.query.plate.findFirst({
			where: (plate, { eq }) => eq(plate.id, data.plateId),
			columns: {
				OBSERVAT: true,
				"PLATE-N": true,
				OBSERVER: true,
				DIGITALI: true,
				SCANNER: true,
				SOFTWARE: true,
				TELESCOPE: true,
				DETECTOR: true,
				INSTRUMENT: true,
			},
		});
		if (!plate) {
			throw new Error(`Plate with ID ${data.plateId} not found`);
		}
		return plate;
	});

const submitForm = createServerFn({ method: "POST" })
	.validator(
		z.object({
			plateId: z.string().min(1),
			metadata: PlateMetadataSchema.strip(),
		}),
	)
	.handler(async ({ data }) => {
		await db
			.update(s.plate)
			.set({ ...data.metadata })
			.where(eq(s.plate.id, data.plateId));
	});

export const Route = createFileRoute("/plate/$plateId/metadata")({
	component: RouteComponent,
	loader: async ({ params }) => {
		const initialValues = await getInitialValues({
			data: { plateId: params.plateId },
		});
		return { initialValues };
	},
});

function RouteComponent() {
	const { plateId } = Route.useParams();
	const { initialValues } = Route.useLoaderData();

	const {
		register,
		control,
		formState: { errors, isValid },
		handleSubmit,
	} = useForm({
		resolver: zodResolver(PlateMetadataSchema),
		mode: "onChange",
		defaultValues: initialValues,
	});

	const inputContainerClassName = "w-full max-w-xs items-center gap-1.5";
	const inputClassName = "border p-2 rounded";
	return (
		<form
			className="w-full max-w-7xl"
			onSubmit={handleSubmit((metadata) => {
				submitForm({ data: { plateId, metadata } });
			})}
		>
			<div className="flex flex-wrap justify-center content-normal gap-4">
				<div className={inputContainerClassName}>
					<Label>OBSERVAT</Label>
					<Controller
						name="OBSERVAT"
						control={control}
						render={({ field }) => (
							<SelectObservatory
								value={field.value}
								setValue={field.onChange}
							/>
						)}
					/>

					{errors.OBSERVAT && (
						<p className="text-red-500">{errors.OBSERVAT.message}</p>
					)}
				</div>
				<div className={inputContainerClassName}>
					<Label>PLATE-N</Label>
					<Input
						{...register("PLATE-N")}
						placeholder="Identification number"
						className={inputClassName}
					/>
					{errors["PLATE-N"] && (
						<p className="text-red-500">{errors["PLATE-N"].message}</p>
					)}
				</div>

				<div className={inputContainerClassName}>
					<Label>OBSERVER</Label>
					<Input
						{...register("OBSERVER")}
						placeholder="OBSERVER"
						className={inputClassName}
					/>
					{errors.OBSERVER && (
						<p className="text-red-500">{errors.OBSERVER.message}</p>
					)}
				</div>
				<div className={inputContainerClassName}>
					<Label>DIGITALI</Label>
					<Input
						{...register("DIGITALI")}
						placeholder="DIGITALI"
						className={inputClassName}
					/>
					{errors.DIGITALI && (
						<p className="text-red-500">{errors.DIGITALI.message}</p>
					)}
				</div>
				<div className={inputContainerClassName}>
					<Label>SCANNER</Label>
					<Input
						{...register("SCANNER")}
						placeholder="Scanner name"
						className={inputClassName}
					/>
					{errors.SCANNER && (
						<p className="text-red-500">{errors.SCANNER.message}</p>
					)}
				</div>
				<div className={inputContainerClassName}>
					<Label>SOFTWARE</Label>
					<Input
						{...register("SOFTWARE")}
						placeholder="Scan software"
						className={inputClassName}
					/>
					{errors.SOFTWARE && (
						<p className="text-red-500">{errors.SOFTWARE.message}</p>
					)}
				</div>
				<div className={inputContainerClassName}>
					<Label>TELESCOPE</Label>
					<Input
						{...register("TELESCOPE")}
						placeholder="Telescope name"
						className={inputClassName}
					/>
					{errors.TELESCOPE && (
						<p className="text-red-500">{errors.TELESCOPE.message}</p>
					)}
				</div>
				<div className={inputContainerClassName}>
					<Label>DETECTOR</Label>
					<Input
						{...register("DETECTOR")}
						placeholder="Detector"
						className={inputClassName}
					/>
					{errors.DETECTOR && (
						<p className="text-red-500">{errors.DETECTOR.message}</p>
					)}
				</div>
				<div className={inputContainerClassName}>
					<Label>INSTRUMENT</Label>
					<Input
						{...register("INSTRUMENT")}
						placeholder="Instrument"
						className={inputClassName}
					/>
					{errors.INSTRUMENT && (
						<p className="text-red-500">{errors.INSTRUMENT.message}</p>
					)}
				</div>
			</div>
			<div className="flex gap-4 justify-center">
				<Button type="submit" disabled={!isValid}>
					Save
				</Button>
			</div>
		</form>
	);
}
