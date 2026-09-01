import { z } from 'zod';

import { fetchWithPolicy } from './http';

const transcriptSchema = z.object({
  metadata: z
    .object({
      request_id: z.string().optional(),
      duration: z.number().optional(),
    })
    .optional(),
  results: z.object({
    channels: z
      .array(
        z.object({
          alternatives: z
            .array(
              z.object({
                transcript: z.string(),
                confidence: z.number().optional(),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  }),
});

export async function transcribeAudio(input: {
  apiKey: string;
  audio: ArrayBuffer;
  contentType: string;
  language: 'english' | 'spanish';
}) {
  const language = input.language === 'spanish' ? 'es' : 'en-US';
  const response = await fetchWithPolicy(
    `https://api.deepgram.com/v1/listen?model=nova-3&language=${encodeURIComponent(language)}&smart_format=true&punctuate=true&mip_opt_out=true&tag=commonground-practice`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${input.apiKey}`,
        'Content-Type': input.contentType,
      },
      body: input.audio,
    },
    { label: 'Deepgram transcription', timeoutMs: 20_000, retries: 0 },
  );
  if (!response.ok)
    throw new Error(`Deepgram transcription returned ${response.status}`);
  const parsed = transcriptSchema.parse(await response.json());
  const alternative = parsed.results.channels[0].alternatives[0];
  return {
    transcript: alternative.transcript.trim(),
    confidence: alternative.confidence ?? null,
    durationSeconds: parsed.metadata?.duration ?? null,
    requestId: parsed.metadata?.request_id ?? null,
    model: 'nova-3',
  };
}

export async function synthesizeSpeech(input: {
  apiKey: string;
  text: string;
  language: 'english' | 'spanish';
}) {
  const model =
    input.language === 'spanish' ? 'aura-2-celeste-es' : 'aura-2-thalia-en';
  const response = await fetchWithPolicy(
    `https://api.deepgram.com/v1/speak?model=${model}&encoding=mp3&speed=0.9&mip_opt_out=true&tag=commonground-practice`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: input.text }),
    },
    { label: 'Deepgram speech synthesis', timeoutMs: 20_000, retries: 0 },
  );
  if (!response.ok)
    throw new Error(`Deepgram speech synthesis returned ${response.status}`);
  return { audio: await response.arrayBuffer(), model };
}
