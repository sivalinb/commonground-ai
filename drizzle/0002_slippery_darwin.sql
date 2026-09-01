CREATE TABLE `workflow_checkpoints` (
	`thread_id` text NOT NULL,
	`checkpoint_ns` text DEFAULT '' NOT NULL,
	`checkpoint_id` text NOT NULL,
	`parent_checkpoint_id` text,
	`checkpoint_type` text NOT NULL,
	`checkpoint_data` text NOT NULL,
	`metadata_type` text NOT NULL,
	`metadata_data` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`thread_id`, `checkpoint_ns`, `checkpoint_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_workflow_checkpoints_latest` ON `workflow_checkpoints` (`thread_id`,`checkpoint_ns`,`checkpoint_id`);--> statement-breakpoint
CREATE TABLE `workflow_writes` (
	`thread_id` text NOT NULL,
	`checkpoint_ns` text DEFAULT '' NOT NULL,
	`checkpoint_id` text NOT NULL,
	`task_id` text NOT NULL,
	`write_idx` integer NOT NULL,
	`channel` text NOT NULL,
	`value_type` text NOT NULL,
	`value_data` text NOT NULL,
	PRIMARY KEY(`thread_id`, `checkpoint_ns`, `checkpoint_id`, `task_id`, `write_idx`)
);
--> statement-breakpoint
CREATE INDEX `idx_workflow_writes_checkpoint` ON `workflow_writes` (`thread_id`,`checkpoint_ns`,`checkpoint_id`);