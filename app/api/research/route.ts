import { z } from 'zod';

import { consumeRateLimit } from '@/lib/db';
import { fetchWithPolicy, requireSameOrigin, secureJson } from '@/lib/http';
import { detectSensitiveData } from '@/lib/safety';
import { verifyTurnstile } from '@/lib/turnstile';

const ALLOWED_DOMAINS = [
  'ovc.ojp.gov',
  'ojp.gov',
  'stopbullying.gov',
  'cdpsdocs.state.co.us',
  'colorado.gov',
  'courts.state.co.us',
  'missingkids.org',
  'erieco.gov',
];

const requestSchema = z.object({
  query: z.string().trim().min(10).max(500),
  turnstileToken: z.string().max(2048).optional(),
});

const searchItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  description: z.string().optional(),
  snippets: z.array(z.string()).optional(),
  page_age: z.string().nullable().optional(),
});

const searchResponseSchema = z.object({
  results: z.object({
    web: z.array(searchItemSchema).optional(),
    news: z.array(searchItemSchema).optional(),
  }).optional(),
});

function allowedUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_DOMAINS.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return secureJson({ error: 'Cross-origin requests are not accepted.' }, 403);
  if (!(await consumeRateLimit(request, 'research', 8, 10 * 60 * 1000))) {
    return secureJson({ error: 'Research request limit reached. Please try again later.' }, 429);
  }
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return secureJson({ error: 'Use a 10–500 character fictional research question.' }, 400);
    const { query, turnstileToken } = parsed.data;
    if (detectSensitiveData(query).length) return secureJson({ error: 'Remove identifying or case-specific information before researching.' }, 422);
    const turnstile = await verifyTurnstile(turnstileToken, request);
    if (!turnstile.verified) return secureJson({ error: 'Human verification is required before using public-source research.' }, 403);
    if (!process.env.YOU_API_KEY) return secureJson({ error: 'Freshness research is not configured.' }, 503);
    const started = Date.now();
    const response = await fetchWithPolicy(
      'https://ydc-index.io/v1/search',
      {
        method: 'POST',
        headers: { 'X-API-Key': process.env.YOU_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, count: 6, safesearch: 'strict', include_domains: ALLOWED_DOMAINS }),
      },
      { label: 'You.com research', timeoutMs: 9000, retries: 1 },
    );
    if (!response.ok) throw new Error(`You.com returned ${response.status}`);
    const body = searchResponseSchema.parse(await response.json());
    const combined = [...(body.results?.web || []), ...(body.results?.news || [])];
    const results = combined.filter((item) => allowedUrl(item.url)).slice(0, 6).map((item) => ({
      title: item.title,
      url: item.url,
      description: item.description || item.snippets?.[0] || '',
      publishedAt: item.page_age || null,
    }));
    return secureJson({ results, latencyMs: Date.now() - started, advisoryOnly: true, allowlistedDomains: ALLOWED_DOMAINS.length });
  } catch {
    return secureJson({ error: 'Freshness research could not complete.' }, 502);
  }
}
