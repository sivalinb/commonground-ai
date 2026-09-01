import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
    safetyApproved: integer('safety_approved', { mode: 'boolean' }).notNull().default(false),
    promptVersion: text('prompt_version').notNull(),
    corpusVersion: text('corpus_version').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('idx_approval_requests_trace_id').on(table.traceId),
    index('idx_approval_requests_status_updated').on(table.status, table.updatedAt),
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
    uniqueIndex('idx_rate_limit_windows_lookup').on(table.keyHash, table.route, table.windowStart),
  ],
);
