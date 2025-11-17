CREATE TABLE `material` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`material` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `material_name` ON `material` (`name`);