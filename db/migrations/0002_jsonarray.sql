ALTER TABLE `spectrum` ADD `intensityArr` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `spectrum` DROP COLUMN `intensity_arr`;