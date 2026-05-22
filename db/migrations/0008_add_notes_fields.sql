ALTER TABLE `plate` RENAME COLUMN "notes" TO "platnote";--> statement-breakpoint
ALTER TABLE `plate` RENAME COLUMN "notes_known" TO "platnote_known";--> statement-breakpoint
ALTER TABLE `plate` ADD `scannote` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `plate` ADD `scannote_known` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `calibration` ADD `calnotes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `calibration` ADD `calnotes_known` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `observation` ADD `objnotes` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `observation` ADD `objnotes_known` integer DEFAULT true NOT NULL;