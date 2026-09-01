import { env } from 'cloudflare:workers';

import type { PublicResult } from './contracts';

type DatabaseEnv = { DB?: D1Database; RATE_LIMIT_SALT?: string };

function database() {
  return (env as unknown as DatabaseEnv).DB;
}

let initialized = false;

async function ensureSchema(db: D1Database) {
  if (initialized) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT PRIMARY KEY NOT NULL,
      trace_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      decision TEXT,
      reviewer_role TEXT,
      comment TEXT,
      citation_count INTEGER DEFAULT 0 NOT NULL,
      grounding_score REAL DEFAULT 0 NOT NULL,
      safety_approved INTEGER DEFAULT 0 NOT NULL,
      prompt_version TEXT NOT NULL,
      corpus_version TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_approval_requests_trace_id ON approval_requests (trace_id)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_approval_requests_status_updated ON approval_requests (status, updated_at)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS rate_limit_windows (
      key_hash TEXT NOT NULL,
      route TEXT NOT NULL,
      window_start INTEGER NOT NULL,
      count INTEGER DEFAULT 1 NOT NULL,
      PRIMARY KEY (key_hash, route, window_start)
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_lookup ON rate_limit_windows (key_hash, route, window_start)'),
  ]);
  initialized = true;
}

export async function savePendingApproval(result: PublicResult) {
  const db = database();
  if (!db || !result.approvalId) return false;
  await ensureSchema(db);
  const now = Date.now();
  await db
    .prepare(`INSERT OR REPLACE INTO approval_requests (
      id, trace_id, status, citation_count, grounding_score, safety_approved,
      prompt_version, corpus_version, created_at, updated_at
    ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      result.approvalId,
      result.traceId,
      result.citations.length,
      result.groundingScore,
      result.safetyApproved ? 1 : 0,
      result.promptVersion,
      result.corpusVersion,
      now,
      now,
    )
    .run();
  return true;
}

export async function recordApproval(input: {
  approvalId: string;
  decision: 'approved' | 'revision_requested';
  reviewerRole: string;
  comment: string;
}) {
  const db = database();
  if (!db) return { persisted: false, status: input.decision };
  await ensureSchema(db);
  const result = await db
    .prepare(`UPDATE approval_requests
      SET status = ?, decision = ?, reviewer_role = ?, comment = ?, updated_at = ?
      WHERE id = ? AND status = 'pending'`)
    .bind(input.decision, input.decision, input.reviewerRole, input.comment, Date.now(), input.approvalId)
    .run();
  return { persisted: true, status: input.decision, changed: Number(result.meta.changes || 0) > 0 };
}

async function hashRateKey(value: string) {
  const salt = (env as unknown as DatabaseEnv).RATE_LIMIT_SALT || 'commonground-rotating-demo-key';
  const day = new Date().toISOString().slice(0, 10);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${day}:${value}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const memoryWindows = new Map<string, { count: number; windowStart: number }>();

export async function consumeRateLimit(request: Request, route: string, limit: number, windowMs: number) {
  const client = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'local';
  const keyHash = await hashRateKey(client);
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const db = database();
  if (!db) {
    const key = `${keyHash}:${route}:${windowStart}`;
    const current = memoryWindows.get(key) || { count: 0, windowStart };
    current.count += 1;
    memoryWindows.set(key, current);
    return current.count <= limit;
  }
  await ensureSchema(db);
  await db
    .prepare(`INSERT INTO rate_limit_windows (key_hash, route, window_start, count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(key_hash, route, window_start) DO UPDATE SET count = count + 1`)
    .bind(keyHash, route, windowStart)
    .run();
  const row = await db
    .prepare('SELECT count FROM rate_limit_windows WHERE key_hash = ? AND route = ? AND window_start = ?')
    .bind(keyHash, route, windowStart)
    .first<{ count: number }>();
  if (Math.random() < 0.02) {
    await db.prepare('DELETE FROM rate_limit_windows WHERE window_start < ?').bind(windowStart - windowMs * 6).run();
  }
  return (row?.count || 0) <= limit;
}
