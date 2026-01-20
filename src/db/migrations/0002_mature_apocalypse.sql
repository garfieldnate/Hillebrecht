CREATE TABLE `task_dependencies` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`depends_on_task_id` text NOT NULL,
	`dependency_type` text NOT NULL,
	`notes` text,
	FOREIGN KEY (`task_id`) REFERENCES `task_templates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`depends_on_task_id`) REFERENCES `task_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dep_task_idx` ON `task_dependencies` (`task_id`);--> statement-breakpoint
CREATE INDEX `dep_depends_on_idx` ON `task_dependencies` (`depends_on_task_id`);--> statement-breakpoint
CREATE TABLE `task_instance_dependencies` (
	`id` text PRIMARY KEY NOT NULL,
	`instance_id` text NOT NULL,
	`depends_on_instance_id` text NOT NULL,
	`dependency_type` text NOT NULL,
	FOREIGN KEY (`instance_id`) REFERENCES `task_instances`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`depends_on_instance_id`) REFERENCES `task_instances`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `inst_dep_instance_idx` ON `task_instance_dependencies` (`instance_id`);--> statement-breakpoint
CREATE INDEX `inst_dep_depends_on_idx` ON `task_instance_dependencies` (`depends_on_instance_id`);--> statement-breakpoint
CREATE TABLE `task_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`due_date` text NOT NULL,
	`due_time` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` text,
	`context` text,
	`started_date` text,
	`completed_date` text,
	`actual_minutes` integer,
	`outcome` text,
	`results` text,
	`issues` text,
	`photos` text,
	`recurrence_index` integer,
	`next_instance_date` text,
	`metadata` text,
	FOREIGN KEY (`template_id`) REFERENCES `task_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `instance_status_idx` ON `task_instances` (`status`);--> statement-breakpoint
CREATE INDEX `instance_due_date_idx` ON `task_instances` (`due_date`);--> statement-breakpoint
CREATE INDEX `instance_template_idx` ON `task_instances` (`template_id`);--> statement-breakpoint
CREATE INDEX `instance_category_idx` ON `task_instances` (`category`);--> statement-breakpoint
CREATE TABLE `task_template_tags` (
	`template_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`template_id`, `tag`),
	FOREIGN KEY (`template_id`) REFERENCES `task_templates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `task_tag_idx` ON `task_template_tags` (`tag`);--> statement-breakpoint
CREATE TABLE `task_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`recurrence` text NOT NULL,
	`applies_to` text,
	`instructions` text,
	`estimated_minutes` integer,
	`supplies` text,
	`priority` text,
	`is_active` integer DEFAULT true NOT NULL,
	`notes` text,
	`created_by` text,
	`metadata` text
);
--> statement-breakpoint
CREATE INDEX `template_category_idx` ON `task_templates` (`category`);--> statement-breakpoint
CREATE INDEX `template_active_idx` ON `task_templates` (`is_active`);