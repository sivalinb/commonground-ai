import { secureJson } from '@/lib/http';

export async function GET() {
  return secureJson({
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
    deployment: {
      mode: 'public-training-demo',
      dataBoundary: 'fictional-or-de-identified-only',
      externalActionsEnabled: false,
      agencyAuthorization: false,
      release: process.env.RELEASE_VERSION || 'pilot-v6',
    },
    capabilities: {
      turnstile: Boolean(
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
        process.env.TURNSTILE_SECRET_KEY &&
        process.env.TURNSTILE_ENFORCED === 'true',
      ),
      mistral: Boolean(process.env.MISTRAL_API_KEY),
      deepgram: Boolean(process.env.DEEPGRAM_API_KEY),
      neo4j: Boolean(
        process.env.NEO4J_URI &&
        process.env.NEO4J_USERNAME &&
        process.env.NEO4J_PASSWORD,
      ),
    },
  });
}
