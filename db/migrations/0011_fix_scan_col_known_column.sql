DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "user_username_unique";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
DROP INDEX "calibration_observation_idx";--> statement-breakpoint
DROP INDEX "iers_bulletin_a_mdj_unique";--> statement-breakpoint
DROP INDEX "iers_delta_t_mdj_unique";--> statement-breakpoint
DROP INDEX "material_name";--> statement-breakpoint
DROP INDEX "observation_name_idx";--> statement-breakpoint
ALTER TABLE `observation` ALTER COLUMN "aperture_coefficient" TO "aperture_coefficient" real NOT NULL DEFAULT 0.95;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE UNIQUE INDEX `calibration_observation_idx` ON `calibration` (`observation_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `iers_bulletin_a_mdj_unique` ON `iers_bulletin_a` (`mdj`);--> statement-breakpoint
CREATE UNIQUE INDEX `iers_delta_t_mdj_unique` ON `iers_delta_t` (`mdj`);--> statement-breakpoint
CREATE UNIQUE INDEX `material_name` ON `material` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `observation_name_idx` ON `observation` (`plate_id`,`name`);--> statement-breakpoint
ALTER TABLE `plate` ADD `scancol` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `scan_col_know` integer DEFAULT true NOT NULL;