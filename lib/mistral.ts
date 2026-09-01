import { z } from 'zod';

import { fetchWithPolicy } from './http';

const MISTRAL_BASE = 'https://api.mistral.ai/v1';

const responseSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string() }) }))
    .min(1),
  usage: z.object({ total_tokens: z.number().optional() }).optional(),
});

export async function mistralStructured<T extends z.ZodType>(input: {
  apiKey: string;
  model: string;
  schema: T;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  system: string;
  user: string;
  maxTokens?: number;
}) {
  const request = async (responseFormat: Record<string, unknown>) => {
    const response = await fetchWithPolicy(
      `${MISTRAL_BASE}/chat/completions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${input.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: input.model,
          temperature: 0,
          max_tokens: input.maxTokens || 420,
          safe_prompt: true,
          response_format: responseFormat,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.user },
          ],
        }),
      },
      { label: 'Mistral structured review', timeoutMs: 18_000, retries: 1 },
    );
    if (!response.ok)
      throw new Error(`Mistral structured review returned ${response.status}`);
    const parsed = responseSchema.parse(await response.json());
    return {
      data: input.schema.parse(
        JSON.parse(parsed.choices[0].message.content),
      ) as z.infer<T>,
      usageTokens: parsed.usage?.total_tokens ?? null,
    };
  };

  try {
    return await request({
      type: 'json_schema',
      json_schema: {
        name: input.schemaName,
        schema: input.jsonSchema,
        strict: true,
      },
    });
  } catch (strictError) {
    try {
      return await request({ type: 'json_object' });
    } catch (fallbackError) {
      throw new Error('Mistral structured and JSON fallback reviews failed.', {
        cause: fallbackError instanceof Error ? fallbackError : strictError,
      });
    }
  }
}
