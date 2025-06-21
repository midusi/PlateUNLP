PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_observatory` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`elevation` real NOT NULL,
	`timezone` text NOT NULL,
	`aliases` text DEFAULT '[]' NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_observatory`("id", "name", "latitude", "longitude", "elevation", "timezone", "aliases", "source") SELECT "id", "name", "latitude", "longitude", "elevation", "timezone", "aliases", "source" FROM `observatory`;--> statement-breakpoint
DROP TABLE `observatory`;--> statement-breakpoint
ALTER TABLE `__new_observatory` RENAME TO `observatory`;--> statement-breakpoint
PRAGMA foreign_keys=ON;