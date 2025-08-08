CREATE TABLE `iers_bulletin_a` (
	`mdj` integer NOT NULL,
	`pm_x` real NOT NULL,
	`pm_y` real NOT NULL,
	`dut1` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `iers_bulletin_a_mdj_unique` ON `iers_bulletin_a` (`mdj`);--> statement-breakpoint
CREATE TABLE `iers_delta_t` (
	`mdj` integer NOT NULL,
	`delta_t` real NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `iers_delta_t_mdj_unique` ON `iers_delta_t` (`mdj`);--> statement-breakpoint
CREATE TABLE `observation` (
	`id` text PRIMARY KEY NOT NULL,
	`plate_id` text NOT NULL,
	`name` text NOT NULL,
	`image_left` integer NOT NULL,
	`image_top` integer NOT NULL,
	`image_width` integer NOT NULL,
	`image_height` integer NOT NULL,
	`metadata_completion` real NOT NULL,
	`object` text DEFAULT '' NOT NULL,
	`object_known` integer DEFAULT true NOT NULL,
	`date_obs` text DEFAULT '' NOT NULL,
	`date_obs_known` integer DEFAULT true NOT NULL,
	`ut` text DEFAULT '' NOT NULL,
	`ut_known` integer DEFAULT true NOT NULL,
	`main_id` text DEFAULT '' NOT NULL,
	`main_id_known` integer DEFAULT true NOT NULL,
	`sptype` text DEFAULT '' NOT NULL,
	`sptype_known` integer DEFAULT true NOT NULL,
	`ra` text DEFAULT '' NOT NULL,
	`ra_known` integer DEFAULT true NOT NULL,
	`dec` text DEFAULT '' NOT NULL,
	`dec_known` integer DEFAULT true NOT NULL,
	`equinox` text DEFAULT '' NOT NULL,
	`equinox_known` integer DEFAULT true NOT NULL,
	`ra2000` text DEFAULT '' NOT NULL,
	`ra2000_known` integer DEFAULT true NOT NULL,
	`dec2000` text DEFAULT '' NOT NULL,
	`dec2000_known` integer DEFAULT true NOT NULL,
	`ra1950` text DEFAULT '' NOT NULL,
	`ra1950_known` integer DEFAULT true NOT NULL,
	`dec1950` text DEFAULT '' NOT NULL,
	`dec1950_known` integer DEFAULT true NOT NULL,
	`time_obs` text DEFAULT '' NOT NULL,
	`time_obs_known` integer DEFAULT true NOT NULL,
	`jd` text DEFAULT '' NOT NULL,
	`jd_known` integer DEFAULT true NOT NULL,
	`st` text DEFAULT '' NOT NULL,
	`st_known` integer DEFAULT true NOT NULL,
	`ha` text DEFAULT '' NOT NULL,
	`ha_known` integer DEFAULT true NOT NULL,
	`airmass` text DEFAULT '' NOT NULL,
	`airmass_known` integer DEFAULT true NOT NULL,
	`gain` text DEFAULT '' NOT NULL,
	`gain_known` integer DEFAULT true NOT NULL,
	`exptime` text DEFAULT '' NOT NULL,
	`exptime_known` integer DEFAULT true NOT NULL,
	`detector` text DEFAULT '' NOT NULL,
	`detector_known` integer DEFAULT true NOT NULL,
	`imagetyp` text DEFAULT '' NOT NULL,
	`imagetyp_known` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`plate_id`) REFERENCES `plate`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `observation_name_idx` ON `observation` (`plate_id`,`name`);--> statement-breakpoint
CREATE TABLE `observatory` (
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
CREATE TABLE `plate` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`image_id` text NOT NULL,
	`image_width` integer NOT NULL,
	`image_height` integer NOT NULL,
	`metadata_completion` real NOT NULL,
	`observat` text DEFAULT 'oalp' NOT NULL,
	`plate_n` text NOT NULL,
	`observer` text DEFAULT '' NOT NULL,
	`observer_known` integer DEFAULT true NOT NULL,
	`digitali` text DEFAULT '' NOT NULL,
	`digitali_known` integer DEFAULT true NOT NULL,
	`scanner` text DEFAULT '' NOT NULL,
	`scanner_known` integer DEFAULT true NOT NULL,
	`software` text DEFAULT '' NOT NULL,
	`software_known` integer DEFAULT true NOT NULL,
	`telescope` text DEFAULT '' NOT NULL,
	`telescope_known` integer DEFAULT true NOT NULL,
	`detector` text DEFAULT '' NOT NULL,
	`detector_known` integer DEFAULT true NOT NULL,
	`instrument` text DEFAULT '' NOT NULL,
	`instrument_known` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`image_id`) REFERENCES `upload`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`observat`) REFERENCES `observatory`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `spectrum` (
	`id` text PRIMARY KEY NOT NULL,
	`observation_id` text NOT NULL,
	`type` text NOT NULL,
	`image_left` integer NOT NULL,
	`image_top` integer NOT NULL,
	`image_width` integer NOT NULL,
	`image_height` integer NOT NULL,
	FOREIGN KEY (`observation_id`) REFERENCES `observation`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `upload` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mime_type` text NOT NULL,
	`uploaded_at` integer
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`hashed_password` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `user_to_project` (
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`user_id`, `project_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
