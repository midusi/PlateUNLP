PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_to_project` (
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`user_id`, `project_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_to_project`("user_id", "project_id", "role") SELECT "user_id", "project_id", "role" FROM `user_to_project`;--> statement-breakpoint
DROP TABLE `user_to_project`;--> statement-breakpoint
ALTER TABLE `__new_user_to_project` RENAME TO `user_to_project`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `observation` ADD `obs_n` text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE `observation`
SET `obs_n` = (
  SELECT
    substr('________________________________', 1, (ranked.rn - 1) / 26) ||
    char(65 + ((ranked.rn - 1) % 26))
  FROM (
    SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `plate_id` ORDER BY `image_top` ASC, `image_left` ASC) AS rn
    FROM `observation`
  ) AS ranked
  WHERE ranked.id = `observation`.`id`
);