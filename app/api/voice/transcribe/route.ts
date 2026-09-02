import { transcribeAudio } from '@/lib/deepgram';
import { consumeRateLimit } from '@/lib/db';
import { requireSameOrigin, secureJson } from '@/lib/http';
import { verifyTurnstile } from '@/lib/turnstile';

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!requireSameOrigin(request))
    return secureJson(
      { error: 'Cross-origin requests are not accepted.' },
      403,
    );
  if (
    !(await consumeRateLimit(request, 'voice-transcribe', 8, 10 * 60 * 1000))
  ) {
    return secureJson(
      { error: 'Voice request limit reached. Please type your response.' },
      429,
    );
  }
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.startsWith('audio/'))
    return secureJson({ error: 'An audio recording is required.' }, 415);
  if (request.headers.get('x-training-use-acknowledged') !== 'true')
    return secureJson(
      { error: 'Confirm fictional training-only use before recording.' },
      400,
    );
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_AUDIO_BYTES)
    return secureJson({ error: 'Keep recordings under five megabytes.' }, 413);
  const turnstile = await verifyTurnstile(
    request.headers.get('x-turnstile-token') || undefined,
    request,
    'voice_transcribe',
  );
  if (!turnstile.verified)
    return secureJson(
      { error: 'Human verification is required before transcription.' },
      403,
    );
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey)
    return secureJson(
      { error: 'Deepgram voice transcription is not configured.' },
      503,
    );
  const language =
    request.headers.get('x-practice-language') === 'spanish'
      ? 'spanish'
      : 'english';
  const audio = await request.arrayBuffer();
  if (!audio.byteLength || audio.byteLength > MAX_AUDIO_BYTES)
    return secureJson({ error: 'The recording was empty or too large.' }, 413);
  try {
    const result = await transcribeAudio({
      apiKey,
      audio,
      contentType,
      language,
    });
    if (!result.transcript)
      return secureJson(
        {
          error:
            'No speech was detected. Please try again or type your response.',
        },
        422,
      );
    return secureJson(result);
  } catch {
    return secureJson(
      {
        error:
          'The recording could not be transcribed. No audio was stored by CommonGround AI.',
      },
      502,
    );
  }
}
