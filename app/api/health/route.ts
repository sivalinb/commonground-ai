import { secureJson } from '@/lib/http';

export async function GET() {
  const services = {
    liveGeneration: Boolean(
      process.env.LIVE_AI_ENABLED === 'true' &&
        process.env.FIREWORKS_API_KEY &&
        process.env.PINECONE_API_KEY &&
        process.env.PINECONE_INDEX_HOST,
    ),
    independentSafetyReview: Boolean(process.env.MISTRAL_API_KEY),
    graphRetrieval: Boolean(
      process.env.NEO4J_URI &&
        process.env.NEO4J_USERNAME &&
        process.env.NEO4J_PASSWORD,
    ),
    voice: Boolean(process.env.DEEPGRAM_API_KEY),
    observability: Boolean(process.env.LANGSMITH_API_KEY),
    freshnessResearch: Boolean(process.env.YOU_API_KEY),
    abuseProtection: Boolean(
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
        process.env.TURNSTILE_SECRET_KEY &&
        process.env.TURNSTILE_ENFORCED === 'true',
    ),
    durableAuditMetadata: true,
  };
  const requiredReady =
    services.liveGeneration &&
    services.independentSafetyReview &&
    services.observability &&
    services.abuseProtection;

  return secureJson({
    status: requiredReady ? 'operational' : 'degraded',
    environment: 'public-training-demo',
    dataBoundary: 'fictional-or-de-identified-only',
    externalActionsEnabled: false,
    checkedAt: new Date().toISOString(),
    release: process.env.RELEASE_VERSION || 'pilot-v6',
    services,
    notice:
      'Configuration status only; this endpoint does not certify provider uptime or agency authorization.',
  });
}
