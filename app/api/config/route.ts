import { secureJson } from '@/lib/http';

export async function GET() {
  return secureJson({
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
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
