ALTER TABLE `observation` ADD `date_org` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `observation` ADD `date_org_known` integer DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE `observation`
SET
  `date_org` = CASE
    WHEN `time_obs` <> '' AND instr(`date_obs`, 'T') > 0
      THEN substr(`date_obs`, 1, instr(`date_obs`, 'T') - 1) || 'T' || `time_obs`
    ELSE ''
  END,
  `date_org_known` = `time_obs_known`;--> statement-breakpoint
ALTER TABLE `observation` DROP COLUMN `time_obs`;--> statement-breakpoint
ALTER TABLE `observation` DROP COLUMN `time_obs_known`;
