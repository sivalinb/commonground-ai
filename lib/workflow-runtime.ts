import type { WorkflowRuntimeInput } from './workflow';

export function normalizePineconeHost(host: string) {
  return host
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

export function workflowRuntimeFromEnvironment(): WorkflowRuntimeInput | null {
  const fireworksKey = process.env.FIREWORKS_API_KEY;
  const pineconeKey = process.env.PINECONE_API_KEY;
  const pineconeHost = process.env.PINECONE_INDEX_HOST;
  if (
    !fireworksKey ||
    !pineconeKey ||
    !pineconeHost ||
    process.env.LIVE_AI_ENABLED !== 'true'
  ) {
    return null;
  }
  return {
    fireworksKey,
    pineconeKey,
    pineconeHost: normalizePineconeHost(pineconeHost),
    namespace: process.env.PINECONE_NAMESPACE || 'commonground-rj-v1',
    embeddingModel:
      process.env.FIREWORKS_EMBEDDING_MODEL ||
      'accounts/fireworks/models/qwen3-embedding-8b',
    embeddingDimensions: Number(
      process.env.FIREWORKS_EMBEDDING_DIMENSIONS || 256,
    ),
    rerankModel:
      process.env.FIREWORKS_RERANK_MODEL ||
      'accounts/fireworks/models/qwen3-reranker-8b',
    chatModel:
      process.env.FIREWORKS_CHAT_MODEL ||
      'accounts/fireworks/models/qwen3p7-plus',
    mistralKey: process.env.MISTRAL_API_KEY,
    mistralModel: process.env.MISTRAL_MODEL || 'mistral-small-latest',
    neo4j:
      process.env.NEO4J_URI &&
      process.env.NEO4J_USERNAME &&
      process.env.NEO4J_PASSWORD
        ? {
            uri: process.env.NEO4J_URI,
            username: process.env.NEO4J_USERNAME,
            password: process.env.NEO4J_PASSWORD,
            database: process.env.NEO4J_DATABASE || 'neo4j',
          }
        : undefined,
  };
}
