CREATE TABLE `approval_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`trace_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`decision` text,
	`reviewer_role` text,
	`comment` text,
	`citation_count` integer DEFAULT 0 NOT NULL,
	`grounding_score` real DEFAULT 0 NOT NULL,
	`safety_approved` integer DEFAULT false NOT NULL,
	`prompt_version` text NOT NULL,
	`corpus_version` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_approval_requests_trace_id` ON `approval_requests` (`trace_id`);--> statement-breakpoint
CREATE INDEX `idx_approval_requests_status_updated` ON `approval_requests` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `rate_limit_windows` (
	`key_hash` text NOT NULL,
	`route` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rate_limit_windows_lookup` ON `rate_limit_windows` (`key_hash`,`route`,`window_start`);
