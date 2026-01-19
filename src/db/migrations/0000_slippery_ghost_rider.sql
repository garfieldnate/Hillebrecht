CREATE TABLE `plant_companions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plant_id` text NOT NULL,
	`companion_plant_id` text NOT NULL,
	`companion_plant_name` text NOT NULL,
	`relationship` text NOT NULL,
	`reason` text NOT NULL,
	`distance_notes` text,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`companion_plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `plant_companion_idx` ON `plant_companions` (`plant_id`,`companion_plant_id`);--> statement-breakpoint
CREATE TABLE `plant_tags` (
	`plant_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`plant_id`, `tag`),
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tag_idx` ON `plant_tags` (`tag`);--> statement-breakpoint
CREATE TABLE `plants` (
	`id` text PRIMARY KEY NOT NULL,
	`common_name` text NOT NULL,
	`variety` text NOT NULL,
	`scientific_name` text,
	`brand` text,
	`soil_richness` text NOT NULL,
	`soil_ph` text NOT NULL,
	`spacing` text NOT NULL,
	`planting_method` text NOT NULL,
	`spring_timing` text,
	`fall_timing` text,
	`seed_depth` real NOT NULL,
	`germination_days` integer NOT NULL,
	`germination_requirements` text,
	`temperature` text NOT NULL,
	`succession_planting` text,
	`frost_tolerance` text NOT NULL,
	`sun_requirement` text NOT NULL,
	`water_requirement` text NOT NULL,
	`growth_habit` text,
	`harvest_stages` text NOT NULL,
	`care` text,
	`notes` text,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `plantings` (
	`id` text PRIMARY KEY NOT NULL,
	`plant_id` text NOT NULL,
	`plant_name` text NOT NULL,
	`variety` text NOT NULL,
	`year` integer NOT NULL,
	`season` text NOT NULL,
	`schedule` text NOT NULL,
	`location` text NOT NULL,
	`quantity` text NOT NULL,
	`status` text NOT NULL,
	`results` text,
	`notes` text,
	`metadata` text,
	FOREIGN KEY (`plant_id`) REFERENCES `plants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `year_season_idx` ON `plantings` (`year`,`season`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `plantings` (`status`);--> statement-breakpoint
CREATE INDEX `plant_id_idx` ON `plantings` (`plant_id`);