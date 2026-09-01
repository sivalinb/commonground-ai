import { analyzeRequestSchema } from '@/lib/contracts';
import { consumeRateLimit, savePendingApproval } from '@/lib/db';
import { requireSameOrigin, secureJson } from '@/lib/http';
import { detectSensitiveData } from '@/lib/safety';
import { verifyTurnstile } from '@/lib/turnstile';
import { executeWorkflow, WorkflowExecutionError } from '@/lib/workflow';
import { ZodError } from 'zod';

function failureClass(error: unknown) {
  if (error instanceof WorkflowExecutionError)
    return `${error.stage}_${error.reason}`;
  const name =
    error && typeof error === 'object' && 'name' in error
      ? String(error.name)
      : '';
  if (error instanceof ZodError || name.includes('Zod'))
    return 'provider_response_validation';
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Fireworks')) return 'model_provider';
  if (message.includes('Pinecone')) return 'retrieval_provider';
  if (message.includes('timed out')) return 'provider_timeout';
  return 'workflow_runtime';
}

export async function POST(request: Request) {
  const traceId = `cg_${crypto.randomUUID()}`;
  if (!requireSameOrigin(request))
    return secureJson(
      { error: 'Cross-origin requests are not accepted.', traceId },
      403,
    );
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return secureJson(
      { error: 'Content-Type must be application/json.', traceId },
      415,
    );
  }
  if (!(await consumeRateLimit(request, 'analysis', 20, 10 * 60 * 1000))) {
    return secureJson(
      { error: 'Demo request limit reached. Please try again later.', traceId },
      429,
    );
  }

  try {
    const parsed = analyzeRequestSchema.safeParse(await request.json());
    if (!parsed.success)
      return secureJson(
        {
          error: 'Use a fictional scenario between 20 and 3,000 characters.',
          traceId,
        },
        400,
      );
    const { caseText, jurisdiction, turnstileToken } = parsed.data;
    const sensitive = detectSensitiveData(caseText);
    if (sensitive.length) {
      return secureJson(
        {
          error: `Privacy screen stopped this request because it may contain: ${sensitive.join(', ')}. Remove identifying details and try again.`,
          privacyBlocked: true,
          traceId,
        },
        422,
      );
    }
    const turnstile = await verifyTurnstile(
      turnstileToken,
      request,
      'commonground_analysis',
    );
    if (!turnstile.verified)
      return secureJson(
        {
          error:
            'Human verification is required before using the live AI demo.',
          traceId,
        },
        403,
      );

    const fireworksKey = process.env.FIREWORKS_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const pineconeHost = process.env.PINECONE_INDEX_HOST;
    if (
      !fireworksKey ||
      !pineconeKey ||
      !pineconeHost ||
      process.env.LIVE_AI_ENABLED !== 'true'
    ) {
      return secureJson(
        { error: 'The live AI adapter is not configured.', traceId },
        503,
      );
    }

    const result = await executeWorkflow({
      caseText,
      jurisdiction,
      traceId,
      approvalId: crypto.randomUUID(),
      runtime: {
        fireworksKey,
        pineconeKey,
        pineconeHost,
        namespace: process.env.PINECONE_NAMESPACE || 'commonground-rj-v1',
        embeddingModel:
          process.env.FIREWORKS_EMBEDDING_MODEL ||
          'accounts/fireworks/models/qwen3-embedding-8b',
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
      },
    });
    if (result.awaitingApproval)
      await savePendingApproval(result).catch(() => undefined);
    return secureJson({ ...result, turnstileConfigured: turnstile.configured });
  } catch (error) {
    const classified = failureClass(error);
    console.error(
      traceId,
      classified,
      error instanceof Error ? error.message : 'Unknown live analysis error',
    );
    return secureJson(
      {
        error: 'The live analysis could not complete. No action was taken.',
        failureClass: classified,
        failureStage:
          error instanceof WorkflowExecutionError ? error.stage : undefined,
        traceId,
      },
      502,
    );
  }
}
