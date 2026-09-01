CREATE TABLE `policy_monitor_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`candidate_count` integer DEFAULT 0 NOT NULL,
	`high_materiality_count` integer DEFAULT 0 NOT NULL,
	`latency_ms` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_policy_monitor_runs_created_at` ON `policy_monitor_runs` (`created_at`);--> statement-breakpoint
CREATE TABLE `practice_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`overall_score` integer NOT NULL,
	`autonomy_score` integer NOT NULL,
	`trauma_aware_score` integer NOT NULL,
	`evidence_count` integer DEFAULT 0 NOT NULL,
	`safety_approved` integer DEFAULT false NOT NULL,
	`pause_recommended` integer DEFAULT false NOT NULL,
	`role` text NOT NULL,
	`language` text NOT NULL,
	`prompt_version` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_practice_runs_created_at` ON `practice_runs` (`created_at`);