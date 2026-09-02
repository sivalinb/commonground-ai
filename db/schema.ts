import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const approvalRequests = sqliteTable(
  'approval_requests',
  {
    id: text('id').primaryKey(),
    traceId: text('trace_id').notNull(),
    status: text('status').notNull().default('pending'),
    decision: text('decision'),
    reviewerRole: text('reviewer_role'),
    comment: text('comment'),
    citationCount: integer('citation_count').notNull().default(0),
    groundingScore: real('grounding_score').notNull().default(0),
    safetyApproved: integer('safety_approved', { mode: 'boolean' })
      .notNull()
      .default(false),
    promptVersion: text('prompt_version').notNull(),
    corpusVersion: text('corpus_version').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('idx_approval_requests_trace_id').on(table.traceId),
    index('idx_approval_requests_status_updated').on(
      table.status,
      table.updatedAt,
    ),
  ],
);

export const rateLimitWindows = sqliteTable(
  'rate_limit_windows',
  {
    keyHash: text('key_hash').notNull(),
    route: text('route').notNull(),
    windowStart: integer('window_start').notNull(),
    count: integer('count').notNull().default(1),
  },
  (table) => [
    uniqueIndex('idx_rate_limit_windows_lookup').on(
      table.keyHash,
      table.route,
      table.windowStart,
    ),
  ],
);

export const practiceRuns = sqliteTable(
  'practice_runs',
  {
    id: text('id').primaryKey(),
    overallScore: integer('overall_score').notNull(),
    autonomyScore: integer('autonomy_score').notNull(),
    traumaAwareScore: integer('trauma_aware_score').notNull(),
    evidenceCount: integer('evidence_count').notNull().default(0),
    safetyApproved: integer('safety_approved', { mode: 'boolean' })
      .notNull()
      .default(false),
    pauseRecommended: integer('pause_recommended', { mode: 'boolean' })
      .notNull()
      .default(false),
    role: text('role').notNull(),
    language: text('language').notNull(),
    promptVersion: text('prompt_version').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_practice_runs_created_at').on(table.createdAt)],
);

export const policyMonitorRuns = sqliteTable(
  'policy_monitor_runs',
  {
    id: text('id').primaryKey(),
    candidateCount: integer('candidate_count').notNull().default(0),
    highMaterialityCount: integer('high_materiality_count')
      .notNull()
      .default(0),
    latencyMs: integer('latency_ms').notNull().default(0),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_policy_monitor_runs_created_at').on(table.createdAt)],
);

export const auditEvents = sqliteTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    eventType: text('event_type').notNull(),
    traceId: text('trace_id'),
    resourceId: text('resource_id'),
    actorRole: text('actor_role'),
    outcome: text('outcome').notNull(),
    details: text('details').notNull().default('{}'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('idx_audit_events_type_created').on(
      table.eventType,
      table.createdAt,
    ),
    index('idx_audit_events_trace_id').on(table.traceId),
  ],
);

export const workflowCheckpoints = sqliteTable(
  'workflow_checkpoints',
  {
    threadId: text('thread_id').notNull(),
    checkpointNamespace: text('checkpoint_ns').notNull().default(''),
    checkpointId: text('checkpoint_id').notNull(),
    parentCheckpointId: text('parent_checkpoint_id'),
    checkpointType: text('checkpoint_type').notNull(),
    checkpointData: text('checkpoint_data').notNull(),
    metadataType: text('metadata_type').notNull(),
    metadataData: text('metadata_data').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.threadId, table.checkpointNamespace, table.checkpointId],
    }),
    index('idx_workflow_checkpoints_latest').on(
      table.threadId,
      table.checkpointNamespace,
      table.checkpointId,
    ),
  ],
);

export const workflowWrites = sqliteTable(
  'workflow_writes',
  {
    threadId: text('thread_id').notNull(),
    checkpointNamespace: text('checkpoint_ns').notNull().default(''),
    checkpointId: text('checkpoint_id').notNull(),
    taskId: text('task_id').notNull(),
    writeIndex: integer('write_idx').notNull(),
    channel: text('channel').notNull(),
    valueType: text('value_type').notNull(),
    valueData: text('value_data').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.threadId,
        table.checkpointNamespace,
        table.checkpointId,
        table.taskId,
        table.writeIndex,
      ],
    }),
    index('idx_workflow_writes_checkpoint').on(
      table.threadId,
      table.checkpointNamespace,
      table.checkpointId,
    ),
  ],
);
