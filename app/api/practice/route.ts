import { z } from 'zod';

import { consumeRateLimit, recordAuditEvent, savePracticeRun } from '@/lib/db';
import { requireSameOrigin, secureJson } from '@/lib/http';
import { executePractice } from '@/lib/practice';
import { normalizePineconeHost } from '@/lib/workflow-runtime';
import { detectProhibitedRequest, detectSensitiveData } from '@/lib/safety';
import { verifyTurnstile } from '@/lib/turnstile';

const requestSchema = z.object({
  scenario: z.string().trim().min(20).max(2000),
  learnerResponse: z.string().trim().min(10).max(1500),
  role: z
    .enum(['volunteer', 'facilitator', 'victim_advocate'])
    .default('volunteer'),
  jurisdiction: z.enum(['colorado', 'national']).default('colorado'),
  language: z.enum(['english', 'spanish']).default('english'),
  turnstileToken: z.string().max(2048).optional(),
  trainingUseAcknowledged: z.literal(true),
});

export async function POST(request: Request) {
  const traceId = `practice_${crypto.randomUUID()}`;
  if (!requireSameOrigin(request))
    return secureJson(
      { error: 'Cross-origin requests are not accepted.', traceId },
      403,
    );
  if (!request.headers.get('content-type')?.includes('application/json'))
    return secureJson(
      { error: 'Content-Type must be application/json.', traceId },
      415,
    );
  if (!(await consumeRateLimit(request, 'practice', 12, 10 * 60 * 1000)))
    return secureJson(
      {
        error: 'Practice request limit reached. Please try again later.',
        traceId,
      },
      429,
    );
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success)
      return secureJson(
        {
          error:
            'Use a fictional scenario and a learner response of at least 10 characters.',
          traceId,
        },
        400,
      );
    const combined = `${parsed.data.scenario}\n${parsed.data.learnerResponse}`;
    const sensitive = detectSensitiveData(combined);
    if (sensitive.length)
      await recordAuditEvent({
        eventType: 'privacy_blocked',
        traceId,
        outcome: 'blocked_before_provider',
        details: { detectorCount: sensitive.length, route: 'practice' },
      }).catch(() => undefined);
    if (sensitive.length)
      return secureJson(
        {
          error: `Privacy firewall detected: ${sensitive.join(', ')}. Remove identifying details and retry.`,
          privacyBlocked: true,
          traceId,
        },
        422,
      );
    if (detectProhibitedRequest(parsed.data.learnerResponse))
      return secureJson(
        {
          error:
            'The learner response requests a prohibited judgment or coerced participation.',
          traceId,
        },
        422,
      );
    const turnstile = await verifyTurnstile(
      parsed.data.turnstileToken,
      request,
      'practice_run',
    );
    if (!turnstile.verified)
      return secureJson(
        {
          error:
            'Human verification is required before running the practice lab.',
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
    )
      return secureJson(
        { error: 'The live practice adapters are not configured.', traceId },
        503,
      );
    const result = await executePractice({
      ...parsed.data,
      traceId,
      runtime: {
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
        fastModel:
          process.env.FIREWORKS_FAST_MODEL ||
          process.env.FIREWORKS_CHAT_MODEL ||
          'accounts/fireworks/models/qwen3p7-plus',
        mistralKey: process.env.MISTRAL_API_KEY,
        mistralModel: process.env.MISTRAL_MODEL || 'mistral-small-latest',
      },
    });
    await savePracticeRun(result).catch(() => undefined);
    return secureJson({ ...result, turnstileConfigured: turnstile.configured });
  } catch (error) {
    console.error(
      traceId,
      error instanceof Error ? error.message : 'Practice workflow failed',
    );
    return secureJson(
      {
        error:
          'The practice agents could not complete safely. No narrative was stored.',
        traceId,
      },
      502,
    );
  }
}
