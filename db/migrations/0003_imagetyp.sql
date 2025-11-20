DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "calibration_observation_idx";--> statement-breakpoint
DROP INDEX "iers_bulletin_a_mdj_unique";--> statement-breakpoint
DROP INDEX "iers_delta_t_mdj_unique";--> statement-breakpoint
DROP INDEX "material_name";--> statement-breakpoint
DROP INDEX "observation_name_idx";--> statement-breakpoint
ALTER TABLE `observation` ALTER COLUMN "imagetyp" TO "imagetyp" text NOT NULL DEFAULT 'object';--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `calibration_observation_idx` ON `calibration` (`observation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `iers_bulletin_a_mdj_unique` ON `iers_bulletin_a` (`mdj`);--> statement-breakpoint
CREATE UNIQUE INDEX `iers_delta_t_mdj_unique` ON `iers_delta_t` (`mdj`);--> statement-breakpoint
CREATE UNIQUE INDEX `material_name` ON `material` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `observation_name_idx` ON `observation` (`plate_id`,`name`);