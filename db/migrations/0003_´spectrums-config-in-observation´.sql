ALTER TABLE `observation` ADD `count_medias_points` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `observation` ADD `aperture_coefficient` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `spectrum` DROP COLUMN `count_medias_points`;--> statement-breakpoint
ALTER TABLE `spectrum` DROP COLUMN `aperture_coefficient`;