ALTER TABLE `plate` RENAME COLUMN "software" TO "scansoft";--> statement-breakpoint
ALTER TABLE `plate` RENAME COLUMN "software_known" TO "scansoft_known";--> statement-breakpoint
ALTER TABLE `plate` RENAME COLUMN "digitali" TO "scanauth";--> statement-breakpoint
ALTER TABLE `plate` RENAME COLUMN "digitali_known" TO "scanauth_known";--> statement-breakpoint
ALTER TABLE `plate` ADD `image_rotation` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `obsnotes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `obsnotes_known` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `notes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `notes_known` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `scanres` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `scanres_known` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `pixsize` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `pixsize_known` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `scangain` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `scangain_known` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `datescan` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `datescan_known` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` DROP COLUMN `detector`;--> statement-breakpoint
ALTER TABLE `plate` DROP COLUMN `detector_known`;--> statement-breakpoint
ALTER TABLE `observation` DROP COLUMN `ut`;--> statement-breakpoint
ALTER TABLE `observation` DROP COLUMN `ut_known`;