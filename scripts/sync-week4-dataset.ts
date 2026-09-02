import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

import { Client } from 'langsmith';

import { detectProhibitedRequest, detectSensitiveData } from '../lib/safety';

type Disposition = 'answer' | 'abstain' | 'refuse' | 'privacy_block';
type Split = 'happy_path' | 'edge_case' | 'known_failure' | 'adversarial';
type GoldenCase = {
  id: string;
  split: Split;
  cohort: 'provider_benchmark_core' | 'golden_extension';
  caseText: string;
  jurisdiction: 'colorado' | 'national';
  expectedDisposition: Disposition;
  expectedSourceIds: string[];
  critical: boolean;
  tags: string[];
  referenceRationale: string;
  humanLabels: {
    autonomy: number;
    traumaAware: number;
    handoffRequired: number;
  };
};

const DATASET_NAME = 'commonground-rj-week4-200-v2';
const DATASET_VERSION = '2.0.0';
const datasetPath = new URL(
  '../evals/commonground-rj-week4-200-v2.jsonl',
  import.meta.url,
);
const manifestPath = new URL(
  '../data/week4-dataset-manifest.json',
  import.meta.url,
);
const knowledgePath = new URL('../data/knowledge.json', import.meta.url);
const expectedDistribution: Record<Split, number> = {
  happy_path: 100,
  edge_case: 60,
  known_failure: 30,
  adversarial: 10,
};

function stableUuid(value: string) {
  const bytes = createHash('sha256').update(value).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const cases = (await readFile(datasetPath, 'utf8'))
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line) as GoldenCase);
const knowledge = JSON.parse(await readFile(knowledgePath, 'utf8')) as Array<{
  id: string;
}>;
const sourceIds = new Set(knowledge.map((item) => item.id));

function validateDataset() {
  const errors: string[] = [];
  if (cases.length !== 200)
    errors.push(`Expected 200 cases; found ${cases.length}.`);
  if (new Set(cases.map((item) => item.id)).size !== cases.length)
    errors.push('Case IDs must be unique.');
  if (new Set(cases.map((item) => item.caseText)).size !== cases.length)
    errors.push('Case narratives must be unique.');
  for (const [split, expected] of Object.entries(expectedDistribution)) {
    const actual = cases.filter((item) => item.split === split).length;
    if (actual !== expected)
      errors.push(`${split} must contain ${expected} cases; found ${actual}.`);
  }
  const core = cases.filter(
    (item) => item.cohort === 'provider_benchmark_core',
  ).length;
  if (core !== 40)
    errors.push(`Expected 40 benchmark-core cases; found ${core}.`);
  for (const item of cases) {
    if (!item.referenceRationale || !item.tags.length)
      errors.push(`${item.id} is missing tags or reference rationale.`);
    if (item.expectedDisposition === 'answer' && !item.expectedSourceIds.length)
      errors.push(`${item.id} expects an answer without expected evidence.`);
    for (const id of item.expectedSourceIds)
      if (!sourceIds.has(id))
        errors.push(`${item.id} references unknown source ${id}.`);
    if (
      item.expectedDisposition === 'privacy_block' &&
      !detectSensitiveData(item.caseText).length
    )
      errors.push(`${item.id} does not activate the privacy evaluator.`);
    if (
      item.expectedDisposition === 'refuse' &&
      !detectProhibitedRequest(item.caseText)
    )
      errors.push(`${item.id} does not activate the prohibited-request gate.`);
    if (![0, 1].includes(item.humanLabels.autonomy))
      errors.push(`${item.id} has an invalid autonomy label.`);
    if (![0, 1].includes(item.humanLabels.traumaAware))
      errors.push(`${item.id} has an invalid trauma-aware label.`);
    if (![0, 1].includes(item.humanLabels.handoffRequired))
      errors.push(`${item.id} has an invalid handoff label.`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return {
    total: cases.length,
    distribution: expectedDistribution,
    cohorts: {
      providerBenchmarkCore: core,
      goldenExtension: cases.length - core,
    },
    dispositions: Object.fromEntries(
      ['answer', 'abstain', 'refuse', 'privacy_block'].map((disposition) => [
        disposition,
        cases.filter((item) => item.expectedDisposition === disposition).length,
      ]),
    ),
    criticalCases: cases.filter((item) => item.critical).length,
  };
}

const validation = validateDataset();
if (!process.argv.includes('--langsmith')) {
  console.log(
    JSON.stringify(
      {
        dataset: DATASET_NAME,
        version: DATASET_VERSION,
        valid: true,
        ...validation,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const client = new Client({
  apiKey: process.env.LANGSMITH_API_KEY,
  apiUrl: process.env.LANGSMITH_ENDPOINT,
});
const exists = await client.hasDataset({ datasetName: DATASET_NAME });
const dataset = exists
  ? await client.readDataset({ datasetName: DATASET_NAME })
  : await client.createDataset(DATASET_NAME, {
      description:
        'Version 2.0.0: 200 synthetic, de-identified CommonGround AI golden cases with manually specified reference outcomes; includes the 40-case provider-tested benchmark core.',
      metadata: {
        version: DATASET_VERSION,
        provenance:
          'synthetic_deidentified_manually_specified_reference_labels',
        benchmark_core: 40,
        golden_extension: 160,
        ...expectedDistribution,
      },
    });

const existing = new Set<string>();
for await (const example of client.listExamples({ datasetId: dataset.id }))
  existing.add(example.id);
const uploads = cases
  .map((item) => ({
    id: stableUuid(`${DATASET_NAME}:${item.id}`),
    dataset_id: dataset.id,
    inputs: {
      caseId: item.id,
      caseText: item.caseText,
      jurisdiction: item.jurisdiction,
    },
    outputs: {
      expectedDisposition: item.expectedDisposition,
      expectedSourceIds: item.expectedSourceIds,
      humanLabels: item.humanLabels,
      referenceRationale: item.referenceRationale,
    },
    metadata: {
      datasetVersion: DATASET_VERSION,
      cohort: item.cohort,
      split: item.split,
      tags: item.tags,
      critical: item.critical,
    },
    split: [item.split, item.cohort],
  }))
  .filter((item) => !existing.has(item.id));
if (uploads.length) await client.createExamples(uploads);

const datasetUrl = await client.getDatasetUrl({ datasetId: dataset.id });
const allExamples = [];
for await (const example of client.listExamples({ datasetId: dataset.id }))
  allExamples.push(example.id);
if (allExamples.length !== 200)
  throw new Error(
    `LangSmith verification failed: expected 200 examples, found ${allExamples.length}.`,
  );

const manifest = {
  dataset: DATASET_NAME,
  datasetVersion: DATASET_VERSION,
  generatedAt: new Date().toISOString(),
  langsmith: {
    datasetId: dataset.id,
    datasetName: DATASET_NAME,
    datasetUrl,
    versionTag: 'v2.0.0',
    versionStrategy: 'immutable_dataset_name_and_metadata',
    verifiedExampleCount: allExamples.length,
  },
  ...validation,
  referenceLabels:
    'Manually specified, human-readable reference labels; independent reviewer calibration remains required before operational use.',
  privacy:
    'Synthetic and de-identified. Fictional identifiers appear only in privacy-gate test cases.',
  publicEvidence:
    'The public evaluation scorecard reads this manifest directly and separates deterministic 200-case validation from 40-case provider-backed results.',
  evaluationStatus: {
    providerBackedCore: 40,
    deterministicValidation: 200,
    fullProviderRun: 'not_run',
    note: 'The existing 40-case core has frozen provider-backed baseline and improved experiments. The full 200-case provider run is intentionally separate to control cost and preserve honest reporting.',
  },
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
