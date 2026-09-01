import { fetchWithPolicy } from './http';

type RunPayload = Record<string, unknown>;

export class MetadataTracer {
  readonly runId = crypto.randomUUID();
  readonly timeline: Array<{ stage: string; label: string; status: 'passed' | 'stopped' | 'waiting'; durationMs: number; detail: string }> = [];
  private readonly endpoint = (process.env.LANGSMITH_ENDPOINT || 'https://api.smith.langchain.com').replace(/\/$/, '');
  private readonly apiKey = process.env.LANGSMITH_API_KEY;

  private headers() {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    if (process.env.LANGSMITH_WORKSPACE_ID) headers['x-tenant-id'] = process.env.LANGSMITH_WORKSPACE_ID;
    return headers;
  }

  private async send(path: string, method: string, body: RunPayload) {
    if (!this.apiKey) return;
    const response = await fetchWithPolicy(
      `${this.endpoint}${path}`,
      { method, headers: this.headers(), body: JSON.stringify(body) },
      { label: 'LangSmith', timeoutMs: 5000, retries: 0 },
    );
    if (!response.ok) throw new Error(`LangSmith returned ${response.status}`);
  }

  async start(traceId: string, characterCount: number) {
    await this.send('/runs', 'POST', {
      id: this.runId,
      name: 'commonground-langgraph-analysis',
      run_type: 'chain',
      session_name: process.env.LANGSMITH_PROJECT || 'commonground-ai-production',
      start_time: Date.now(),
      inputs: { character_count: characterCount, raw_case_text_logged: false },
      extra: { metadata: { app_trace_id: traceId, environment: 'production', privacy_mode: 'metadata-only', graph_version: 'rj-graph-v5' } },
    });
  }

  async stage<T>(stage: string, label: string, detail: string, operation: () => Promise<T>): Promise<T> {
    const childId = crypto.randomUUID();
    const started = Date.now();
    await this.send('/runs', 'POST', {
      id: childId,
      parent_run_id: this.runId,
      name: stage,
      run_type: 'tool',
      start_time: started,
      inputs: { raw_text_logged: false },
      extra: { metadata: { stage, privacy_mode: 'metadata-only' } },
    }).catch(() => undefined);
    try {
      const result = await operation();
      const durationMs = Date.now() - started;
      this.timeline.push({ stage, label, status: 'passed', durationMs, detail });
      await this.send(`/runs/${childId}`, 'PATCH', { end_time: Date.now(), outputs: { duration_ms: durationMs, raw_output_logged: false } }).catch(() => undefined);
      return result;
    } catch (error) {
      const durationMs = Date.now() - started;
      this.timeline.push({ stage, label, status: 'stopped', durationMs, detail });
      await this.send(`/runs/${childId}`, 'PATCH', { end_time: Date.now(), error: `${stage} failed`, outputs: { raw_output_logged: false } }).catch(() => undefined);
      throw error;
    }
  }

  async finish(outputs: RunPayload, metadata: RunPayload = {}) {
    await this.send(`/runs/${this.runId}`, 'PATCH', {
      end_time: Date.now(),
      outputs: { ...outputs, raw_output_logged: false },
      extra: { metadata },
    }).catch(() => undefined);
  }

  async feedback(scores: Record<string, number>) {
    await Promise.all(Object.entries(scores).map(([key, score]) => this.send('/feedback', 'POST', {
      id: crypto.randomUUID(),
      run_id: this.runId,
      key,
      score,
      feedback_source: { type: 'api', metadata: { evaluator: 'commonground-v4-release-gate' } },
    }))).catch(() => undefined);
  }
}
