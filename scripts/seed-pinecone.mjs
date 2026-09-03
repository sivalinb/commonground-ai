import { readFile } from 'node:fs/promises';

const required = [
  'FIREWORKS_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_INDEX_HOST',
];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}

const documents = JSON.parse(
  await readFile(new URL('../data/knowledge.json', import.meta.url), 'utf8'),
);
const namespace = process.env.PINECONE_NAMESPACE || 'commonground-rj-v1';
const embeddingModel =
  process.env.FIREWORKS_EMBEDDING_MODEL ||
  'accounts/fireworks/models/qwen3-embedding-8b';
const embeddingDimensions = Number(
  process.env.FIREWORKS_EMBEDDING_DIMENSIONS || 256,
);
const pineconeHost = process.env.PINECONE_INDEX_HOST.replace(
  /^https?:\/\//i,
  '',
).replace(/\/+$/, '');

const embeddingResponse = await fetch(
  'https://api.fireworks.ai/inference/v1/embeddings',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FIREWORKS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: documents.map((document) => document.text),
      dimensions: embeddingDimensions,
    }),
  },
);
if (!embeddingResponse.ok) {
  throw new Error(`Fireworks embeddings failed (${embeddingResponse.status})`);
}
const embeddingBody = await embeddingResponse.json();
const vectors = documents.map((document, index) => ({
  id: document.id,
  values: embeddingBody.data[index].embedding,
  metadata: document,
}));

const upsertResponse = await fetch(`https://${pineconeHost}/vectors/upsert`, {
  method: 'POST',
  headers: {
    'Api-Key': process.env.PINECONE_API_KEY,
    'Content-Type': 'application/json',
    'X-Pinecone-Api-Version': '2026-04',
  },
  body: JSON.stringify({ namespace, vectors }),
});
if (!upsertResponse.ok) {
  throw new Error(`Pinecone upsert failed (${upsertResponse.status})`);
}
const upsertBody = await upsertResponse.json();
console.log(
  JSON.stringify({
    namespace,
    upserted: upsertBody.upsertedCount ?? vectors.length,
  }),
);
