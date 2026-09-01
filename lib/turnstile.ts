import { z } from 'zod';

import { fetchWithPolicy } from './http';

const turnstileResponseSchema = z.object({
  success: z.boolean(),
  hostname: z.string().optional(),
  action: z.string().optional(),
  'error-codes': z.array(z.string()).optional(),
});

export async function verifyTurnstile(token: string | undefined, request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const enforced = process.env.TURNSTILE_ENFORCED === 'true';
  if (!secret) return { configured: false, verified: !enforced };
  if (!token) return { configured: true, verified: false };
  const response = await fetchWithPolicy(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: request.headers.get('cf-connecting-ip') || undefined,
        idempotency_key: crypto.randomUUID(),
      }),
    },
    { label: 'Turnstile verification', timeoutMs: 6000, retries: 0 },
  );
  if (!response.ok) return { configured: true, verified: false };
  const parsed = turnstileResponseSchema.safeParse(await response.json());
  return { configured: true, verified: parsed.success && parsed.data.success };
}
