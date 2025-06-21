CREATE TABLE `observation` (
	`id` text PRIMARY KEY NOT NULL,
	`x` integer,
	`y` integer,
	`height` integer,
	`width` integer,
	`plateId` text,
	`OBJECT` text NOT NULL,
	`DATE_OBS` text NOT NULL,
	`TIME_OBS` real,
	`MAIN_ID` text NOT NULL,
	`UT` real NOT NULL,
	`ST` real,
	`HA` real,
	`RA` real,
	`DEC` real,
	`GAIN` real,
	`RA2000` real,
	`DEC2000` real,
	`RA1950` real,
	`DEC1950` real,
	`EXPTIME` real,
	`DETECTOR` text,
	`IMAGETYP` text,
	`SPTYPE` text,
	`JD` real,
	`EQUINOX` real,
	`AIRMASS` real,
	FOREIGN KEY (`plateId`) REFERENCES `plate`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `observatory` (
	`id` text PRIMARY KEY NOT NULL,
	`source` text NOT NULL,
	`elevation` integer NOT NULL,
	`name` text NOT NULL,
	`longitude_unit` text NOT NULL,
	`latitude_unit` text NOT NULL,
	`latitude` real NOT NULL,
	`elevation_unit` text NOT NULL,
	`longitude` real NOT NULL,
	`timezone` text NOT NULL,
	`aliases` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plate` (
	`id` text PRIMARY KEY NOT NULL,
	`projectId` text,
	`observat` text,
	`observer` text,
	`digitali` text,
	`scanner` text,
	`software` text,
	`plateN` text,
	`scanImage` text,
	`telescope` text,
	`detector` text,
	`instrument` text,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `spectrum` (
	`id` text PRIMARY KEY NOT NULL,
	`x` integer,
	`y` integer,
	`height` integer,
	`width` integer,
	`observationId` text,
	`type` text NOT NULL,
	FOREIGN KEY (`observationId`) REFERENCES `observation`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`hashedPassword` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `userProject` (
	`userId` text,
	`projectId` text,
	`role` text NOT NULL,
	PRIMARY KEY(`userId`, `projectId`),
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`projectId`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
