import type { RunnableConfig } from '@langchain/core/runnables';
import {
  BaseCheckpointSaver,
  WRITES_IDX_MAP,
  copyCheckpoint,
  getCheckpointId,
  type ChannelVersions,
  type Checkpoint,
  type CheckpointListOptions,
  type CheckpointMetadata,
  type CheckpointPendingWrite,
  type CheckpointTuple,
  type PendingWrite,
} from '@langchain/langgraph-checkpoint';

type CheckpointRow = {
  thread_id: string;
  checkpoint_ns: string;
  checkpoint_id: string;
  parent_checkpoint_id: string | null;
  checkpoint_type: string;
  checkpoint_data: string;
  metadata_type: string;
  metadata_data: string;
};

type WriteRow = {
  task_id: string;
  channel: string;
  value_type: string;
  value_data: string;
};

let schemaPromise: Promise<void> | undefined;

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function configurable(config: RunnableConfig) {
  const threadId = config.configurable?.thread_id;
  if (typeof threadId !== 'string' || !threadId) {
    throw new Error('Durable workflow checkpoint requires a thread_id.');
  }
  const checkpointNs = config.configurable?.checkpoint_ns;
  return {
    threadId,
    checkpointNs: typeof checkpointNs === 'string' ? checkpointNs : '',
    checkpointId: getCheckpointId(config),
  };
}

export function privacyMinimizedCheckpoint(checkpoint: Checkpoint) {
  const prepared = copyCheckpoint(checkpoint);
  if (typeof prepared.channel_values.caseText === 'string') {
    prepared.channel_values.caseText = '[not persisted]';
  }
  if ('queryVector' in prepared.channel_values) {
    prepared.channel_values.queryVector = [];
  }
  if ('candidates' in prepared.channel_values) {
    prepared.channel_values.candidates = [];
  }
  if ('evidence' in prepared.channel_values) {
    prepared.channel_values.evidence = [];
  }
  if ('brief' in prepared.channel_values) {
    prepared.channel_values.brief = null;
  }
  if ('safetyReview' in prepared.channel_values) {
    prepared.channel_values.safetyReview = null;
  }
  if ('crossModelReview' in prepared.channel_values) {
    prepared.channel_values.crossModelReview = null;
  }
  return prepared;
}

/** Cloudflare D1 implementation of the LangGraph checkpoint contract. */
export class D1CheckpointSaver extends BaseCheckpointSaver {
  constructor(private readonly db: D1Database) {
    super();
  }

  private async ensureSchema() {
    if (!schemaPromise) {
      schemaPromise = this.db
        .batch([
          this.db.prepare(`CREATE TABLE IF NOT EXISTS workflow_checkpoints (
            thread_id TEXT NOT NULL,
            checkpoint_ns TEXT DEFAULT '' NOT NULL,
            checkpoint_id TEXT NOT NULL,
            parent_checkpoint_id TEXT,
            checkpoint_type TEXT NOT NULL,
            checkpoint_data TEXT NOT NULL,
            metadata_type TEXT NOT NULL,
            metadata_data TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
          )`),
          this.db
            .prepare(`CREATE INDEX IF NOT EXISTS idx_workflow_checkpoints_latest
            ON workflow_checkpoints (thread_id, checkpoint_ns, checkpoint_id DESC)`),
          this.db.prepare(`CREATE TABLE IF NOT EXISTS workflow_writes (
            thread_id TEXT NOT NULL,
            checkpoint_ns TEXT DEFAULT '' NOT NULL,
            checkpoint_id TEXT NOT NULL,
            task_id TEXT NOT NULL,
            write_idx INTEGER NOT NULL,
            channel TEXT NOT NULL,
            value_type TEXT NOT NULL,
            value_data TEXT NOT NULL,
            PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, write_idx)
          )`),
          this.db
            .prepare(`CREATE INDEX IF NOT EXISTS idx_workflow_writes_checkpoint
            ON workflow_writes (thread_id, checkpoint_ns, checkpoint_id)`),
        ])
        .then(() => undefined)
        .catch((error) => {
          schemaPromise = undefined;
          throw error;
        });
    }
    await schemaPromise;
  }

  private async pendingWrites(row: CheckpointRow) {
    const result = await this.db
      .prepare(`SELECT task_id, channel, value_type, value_data
        FROM workflow_writes
        WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ?
        ORDER BY task_id ASC, write_idx ASC`)
      .bind(row.thread_id, row.checkpoint_ns, row.checkpoint_id)
      .all<WriteRow>();
    return Promise.all(
      (result.results || []).map(
        async (write) =>
          [
            write.task_id,
            write.channel,
            await this.serde.loadsTyped(
              write.value_type,
              base64ToBytes(write.value_data),
            ),
          ] as CheckpointPendingWrite,
      ),
    );
  }

  private async tuple(row: CheckpointRow): Promise<CheckpointTuple> {
    const checkpoint = (await this.serde.loadsTyped(
      row.checkpoint_type,
      base64ToBytes(row.checkpoint_data),
    )) as Checkpoint;
    const metadata = (await this.serde.loadsTyped(
      row.metadata_type,
      base64ToBytes(row.metadata_data),
    )) as CheckpointMetadata;
    const tuple: CheckpointTuple = {
      config: {
        configurable: {
          thread_id: row.thread_id,
          checkpoint_ns: row.checkpoint_ns,
          checkpoint_id: row.checkpoint_id,
        },
      },
      checkpoint,
      metadata,
      pendingWrites: await this.pendingWrites(row),
    };
    if (row.parent_checkpoint_id) {
      tuple.parentConfig = {
        configurable: {
          thread_id: row.thread_id,
          checkpoint_ns: row.checkpoint_ns,
          checkpoint_id: row.parent_checkpoint_id,
        },
      };
    }
    return tuple;
  }

  async getTuple(config: RunnableConfig) {
    await this.ensureSchema();
    const { threadId, checkpointNs, checkpointId } = configurable(config);
    const row = checkpointId
      ? await this.db
          .prepare(`SELECT * FROM workflow_checkpoints
            WHERE thread_id = ? AND checkpoint_ns = ? AND checkpoint_id = ?`)
          .bind(threadId, checkpointNs, checkpointId)
          .first<CheckpointRow>()
      : await this.db
          .prepare(`SELECT * FROM workflow_checkpoints
            WHERE thread_id = ? AND checkpoint_ns = ?
            ORDER BY checkpoint_id DESC LIMIT 1`)
          .bind(threadId, checkpointNs)
          .first<CheckpointRow>();
    return row ? this.tuple(row) : undefined;
  }

  async *list(config: RunnableConfig, options?: CheckpointListOptions) {
    await this.ensureSchema();
    const { threadId, checkpointNs, checkpointId } = configurable(config);
    const result = await this.db
      .prepare(`SELECT * FROM workflow_checkpoints
        WHERE thread_id = ? AND checkpoint_ns = ?
          AND (? IS NULL OR checkpoint_id = ?)
          AND (? IS NULL OR checkpoint_id < ?)
        ORDER BY checkpoint_id DESC`)
      .bind(
        threadId,
        checkpointNs,
        checkpointId || null,
        checkpointId || null,
        options?.before?.configurable?.checkpoint_id || null,
        options?.before?.configurable?.checkpoint_id || null,
      )
      .all<CheckpointRow>();
    let remaining = options?.limit ?? Number.POSITIVE_INFINITY;
    for (const row of result.results || []) {
      if (remaining <= 0) break;
      const tuple = await this.tuple(row);
      if (
        options?.filter &&
        !Object.entries(options.filter).every(
          ([key, value]) =>
            (tuple.metadata as Record<string, unknown> | undefined)?.[key] ===
            value,
        )
      ) {
        continue;
      }
      remaining -= 1;
      yield tuple;
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    _newVersions: ChannelVersions,
  ) {
    await this.ensureSchema();
    const { threadId, checkpointNs, checkpointId } = configurable(config);
    const prepared = privacyMinimizedCheckpoint(checkpoint);
    // D1 stores only the minimum state needed to resume the approval node.
    // Raw narratives, vectors, retrieved excerpts, and generated briefs remain
    // in the request response and are deliberately excluded from checkpoints.
    const [[checkpointType, checkpointBytes], [metadataType, metadataBytes]] =
      await Promise.all([
        this.serde.dumpsTyped(prepared),
        this.serde.dumpsTyped(metadata),
      ]);
    await this.db
      .prepare(`INSERT OR REPLACE INTO workflow_checkpoints (
        thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id,
        checkpoint_type, checkpoint_data, metadata_type, metadata_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        threadId,
        checkpointNs,
        checkpoint.id,
        checkpointId || null,
        checkpointType,
        bytesToBase64(checkpointBytes),
        metadataType,
        bytesToBase64(metadataBytes),
        Date.now(),
      )
      .run();
    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpoint.id,
      },
    };
  }

  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ) {
    await this.ensureSchema();
    const { threadId, checkpointNs, checkpointId } = configurable(config);
    if (!checkpointId)
      throw new Error('Checkpoint writes require checkpoint_id.');
    const statements = await Promise.all(
      writes.map(async ([channel, value], index) => {
        const writeIndex = WRITES_IDX_MAP[channel] ?? index;
        const [valueType, valueBytes] = await this.serde.dumpsTyped(value);
        const operation = writeIndex < 0 ? 'REPLACE' : 'IGNORE';
        return this.db
          .prepare(`INSERT OR ${operation} INTO workflow_writes (
            thread_id, checkpoint_ns, checkpoint_id, task_id, write_idx,
            channel, value_type, value_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            threadId,
            checkpointNs,
            checkpointId,
            taskId,
            writeIndex,
            channel,
            valueType,
            bytesToBase64(valueBytes),
          );
      }),
    );
    if (statements.length) await this.db.batch(statements);
  }

  async deleteThread(threadId: string) {
    await this.ensureSchema();
    await this.db.batch([
      this.db
        .prepare('DELETE FROM workflow_writes WHERE thread_id = ?')
        .bind(threadId),
      this.db
        .prepare('DELETE FROM workflow_checkpoints WHERE thread_id = ?')
        .bind(threadId),
    ]);
  }
}
