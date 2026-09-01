import { z } from 'zod';

import { synthesizeSpeech } from '@/lib/deepgram';
import { consumeRateLimit } from '@/lib/db';
import { requireSameOrigin, secureJson } from '@/lib/http';
import { verifyTurnstile } from '@/lib/turnstile';

const requestSchema = z.object({
  text: z.string().trim().min(1).max(1200),
  language: z.enum(['english', 'spanish']).default('english'),
  turnstileToken: z.string().max(2048).optional(),
});

export async function POST(request: Request) {
  if (!requireSameOrigin(request))
    return secureJson(
      { error: 'Cross-origin requests are not accepted.' },
      403,
    );
  if (!(await consumeRateLimit(request, 'voice-speak', 10, 10 * 60 * 1000))) {
    return secureJson({ error: 'Read-aloud request limit reached.' }, 429);
  }
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success)
    return secureJson({ error: 'Valid read-aloud text is required.' }, 400);
  const turnstile = await verifyTurnstile(
    parsed.data.turnstileToken,
    request,
    'voice_speak',
  );
  if (!turnstile.verified)
    return secureJson(
      { error: 'Human verification is required before AI read-aloud.' },
      403,
    );
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey)
    return secureJson({ error: 'Deepgram read-aloud is not configured.' }, 503);
  try {
    const result = await synthesizeSpeech({
      apiKey,
      text: parsed.data.text,
      language: parsed.data.language,
    });
    return new Response(result.audio, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Voice-Model': result.model,
      },
    });
  } catch {
    return secureJson({ error: 'AI read-aloud could not be generated.' }, 502);
  }
}
