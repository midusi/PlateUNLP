import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "~/db";
import * as s from "~/db/schema";
import { PlateMetadataSchema } from "~/types/spectrum-metadata";

export const updatePlateMetadata = createServerFn({ method: "POST" })
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
