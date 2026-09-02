CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`trace_id` text,
	`resource_id` text,
	`actor_role` text,
	`outcome` text NOT NULL,
	`details` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_events_type_created` ON `audit_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_events_trace_id` ON `audit_events` (`trace_id`);