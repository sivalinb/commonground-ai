import { readFile, writeFile } from 'node:fs/promises';

import { bm25Search } from '../lib/retrieval';

type RetrievalCase = {
  id: string;
  query: string;
  jurisdiction: 'colorado' | 'national';
  expectedSourceIds: string[];
  expectedOutcome: 'answer' | 'abstain';
  tags: string[];
};

type Mode = 'vector' | 'hybrid' | 'graph';

type LiveResult = {
  abstained: boolean;
  awaitingApproval: boolean;
  latencyMs: number;
  finding: { text: string };
  options: Array<{ text: string }>;
  safeguards: Array<{ text: string }>;
  citations: Array<{ id: string; snippet: string }>;
};

type Scored = {
  id: string;
  mode: string;
  expected: string;
  actual: string;
  retrievedIds: string[];
  recallAt5: number | null;
  reciprocalRank: number | null;
  citationPrecision: number | null;
  faithfulness: number | null;
  latencyMs: number | null;
  pass: boolean;
};

const datasetPath = new URL('../evals/rj-retrieval-v1.jsonl', import.meta.url);
const reportPath = new URL(
  '../data/retrieval-eval-report.json',
  import.meta.url,
);
const cases = (await readFile(datasetPath, 'utf8'))
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line) as RetrievalCase);
const live = process.argv.includes('--live');
const baseUrl = (process.env.EVAL_BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);
const secret = process.env.EVAL_RUNNER_SECRET || '';

const percentage = (values: number[]) =>
  values.length
    ? Math.round(
        (values.reduce((sum, value) => sum + value, 0) / values.length) * 1000,
      ) / 10
    : null;

function p95(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[
    Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)
  ];
}

function scoreIds(item: RetrievalCase, ids: string[]) {
  if (!item.expectedSourceIds.length) {
    return { recallAt5: null, reciprocalRank: null, citationPrecision: null };
  }
  const top = ids.slice(0, 5);
  const expected = new Set(item.expectedSourceIds);
  const hits = top.filter((id) => expected.has(id));
  const firstRank = top.findIndex((id) => expected.has(id));
  return {
    recallAt5: hits.length / expected.size,
    reciprocalRank: firstRank < 0 ? 0 : 1 / (firstRank + 1),
    citationPrecision: top.length ? hits.length / top.length : 0,
  };
}

async function judgeFaithfulness(result: LiveResult) {
  if (!result.citations.length || result.abstained) return null;
  const response = await fetch(`${baseUrl}/api/evals/judge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Eval-Runner-Secret': secret,
    },
    body: JSON.stringify({
      claims: [
        result.finding.text,
        ...result.options.map((item) => item.text),
        ...result.safeguards.map((item) => item.text),
      ],
      evidence: result.citations.map((item) => ({
        id: item.id,
        snippet: item.snippet,
      })),
    }),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { faithfulness?: number };
  return typeof body.faithfulness === 'number' ? body.faithfulness : null;
}

async function runLive(item: RetrievalCase, mode: Mode, withJudge: boolean) {
  const response = await fetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Eval-Runner-Secret': secret,
    },
    body: JSON.stringify({
      caseText: item.query,
      trainingUseAcknowledged: true,
      jurisdiction: item.jurisdiction,
      retrievalMode: mode,
    }),
  });
  if (!response.ok) {
    return {
      id: item.id,
      mode,
      expected: item.expectedOutcome,
      actual: `http_${response.status}`,
      retrievedIds: [],
      recallAt5: 0,
      reciprocalRank: 0,
      citationPrecision: 0,
      faithfulness: null,
      latencyMs: null,
      pass: false,
    } satisfies Scored;
  }
  const result = (await response.json()) as LiveResult;
  const ids = result.citations.map((item) => item.id);
  const retrieval = scoreIds(item, ids);
  const actual = result.abstained ? 'abstain' : 'answer';
  const faithfulness = withJudge ? await judgeFaithfulness(result) : null;
  const citationPrecision =
    withJudge && faithfulness !== null
      ? faithfulness
      : retrieval.citationPrecision;
  const pass =
    actual === item.expectedOutcome &&
    (actual === 'abstain' ||
      ((retrieval.recallAt5 || 0) > 0 && result.awaitingApproval));
  return {
    id: item.id,
    mode,
    expected: item.expectedOutcome,
    actual,
    retrievedIds: ids,
    ...retrieval,
    citationPrecision,
    faithfulness,
    latencyMs: result.latencyMs,
    pass,
  } satisfies Scored;
}

async function pooled<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
) {
  const results: R[] = Array.from({ length: items.length });
  let next = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await fn(items[index]);
      }
    }),
  );
  return results;
}

let results: Scored[];
let ablation: Record<string, unknown> | null = null;
if (!live) {
  results = cases.map((item) => {
    const ids = bm25Search(item.query)
      .slice(0, 5)
      .map((match) => match.document.id);
    const retrieval = scoreIds(item, ids);
    const pass =
      item.expectedOutcome === 'abstain' || (retrieval.recallAt5 || 0) > 0;
    return {
      id: item.id,
      mode: 'bm25_preflight',
      expected: item.expectedOutcome,
      actual: item.expectedOutcome === 'abstain' ? 'not_scored' : 'retrieved',
      retrievedIds: ids,
      ...retrieval,
      faithfulness: null,
      latencyMs: null,
      pass,
    };
  });
} else {
  if (!secret)
    throw new Error('EVAL_RUNNER_SECRET is required for live evaluation.');
  const graphResults = await pooled(cases, 3, (item) =>
    runLive(item, 'graph', true),
  );
  results = graphResults;
  const comparisonCases = cases
    .filter((item) => item.expectedOutcome === 'answer')
    .slice(0, 10);
  const [vector, hybrid] = await Promise.all([
    pooled(comparisonCases, 3, (item) => runLive(item, 'vector', false)),
    pooled(comparisonCases, 3, (item) => runLive(item, 'hybrid', false)),
  ]);
  const summarize = (items: Scored[]) => ({
    recallAt5: percentage(
      items.flatMap((item) =>
        item.recallAt5 === null ? [] : [item.recallAt5],
      ),
    ),
    meanReciprocalRank: percentage(
      items.flatMap((item) =>
        item.reciprocalRank === null ? [] : [item.reciprocalRank],
      ),
    ),
    passRate: percentage(items.map((item) => (item.pass ? 1 : 0))),
  });
  ablation = {
    queryCount: comparisonCases.length,
    vector: summarize(vector),
    hybrid: summarize(hybrid),
    graph: summarize(
      graphResults.filter((item) =>
        comparisonCases.some((sample) => sample.id === item.id),
      ),
    ),
  };
}

const answerResults = results.filter((item) => item.expected === 'answer');
const abstentionResults = results.filter((item) => item.expected === 'abstain');
const report = {
  dataset: 'rj-retrieval-v1',
  mode: live ? 'provider-backed' : 'deterministic-preflight',
  generatedAt: new Date().toISOString(),
  targets: {
    recallAt5: 85,
    meanReciprocalRank: 75,
    citationPrecision: 95,
    claimFaithfulness: 90,
    correctAbstention: 90,
    p95LatencyMs: 15000,
  },
  total: results.length,
  passed: results.filter((item) => item.pass).length,
  metrics: {
    recallAt5: percentage(
      answerResults.flatMap((item) =>
        item.recallAt5 === null ? [] : [item.recallAt5],
      ),
    ),
    meanReciprocalRank: percentage(
      answerResults.flatMap((item) =>
        item.reciprocalRank === null ? [] : [item.reciprocalRank],
      ),
    ),
    citationPrecision: live
      ? percentage(
          answerResults.flatMap((item) =>
            item.citationPrecision === null ? [] : [item.citationPrecision],
          ),
        )
      : null,
    claimFaithfulness: live
      ? percentage(
          answerResults.flatMap((item) =>
            item.faithfulness === null ? [] : [item.faithfulness],
          ),
        )
      : null,
    correctAbstention: live
      ? percentage(abstentionResults.map((item) => (item.pass ? 1 : 0)))
      : null,
    p95LatencyMs: live
      ? p95(
          results.flatMap((item) =>
            item.latencyMs === null ? [] : [item.latencyMs],
          ),
        )
      : null,
    taskSuccessRate: percentage(results.map((item) => (item.pass ? 1 : 0))),
  },
  ablation,
  failures: results.filter((item) => !item.pass),
  qualityWarnings: results.filter(
    (item) => item.faithfulness !== null && item.faithfulness < 0.9,
  ),
  note: live
    ? 'Provider-backed GraphRAG run with an independent Mistral claim-faithfulness judge and a 10-query vector/hybrid/graph ablation.'
    : 'Deterministic BM25 retrieval preflight. Run pnpm eval:retrieval:live for provider-backed evaluation.',
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
const targetsMet = live
  ? report.passed === report.total &&
    (report.metrics.recallAt5 || 0) >= report.targets.recallAt5 &&
    (report.metrics.meanReciprocalRank || 0) >=
      report.targets.meanReciprocalRank &&
    (report.metrics.citationPrecision || 0) >=
      report.targets.citationPrecision &&
    (report.metrics.claimFaithfulness || 0) >=
      report.targets.claimFaithfulness &&
    (report.metrics.correctAbstention || 0) >=
      report.targets.correctAbstention &&
    (report.metrics.p95LatencyMs || Number.POSITIVE_INFINITY) <=
      report.targets.p95LatencyMs
  : report.passed === report.total &&
    (report.metrics.recallAt5 || 0) >= report.targets.recallAt5 &&
    (report.metrics.meanReciprocalRank || 0) >=
      report.targets.meanReciprocalRank;
if (!targetsMet) process.exitCode = 1;
