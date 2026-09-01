import { describe, expect, it } from 'vitest';

import { evidenceSchema } from '@/lib/contracts';

describe('AI integration contracts', () => {
  it('keeps graph relevance bounded and inspectable', () => {
    const evidence = evidenceSchema.parse({
      id: 'ovc-choice',
      title: 'Public source',
      section: 'Choice',
      url: 'https://ovc.ojp.gov/example',
      snippet: 'Participation remains voluntary.',
      jurisdiction: 'United States',
      topic: 'victim-autonomy',
      denseScore: 0.8,
      keywordScore: 0.7,
      fusionScore: 0.03,
      graphScore: 0.5,
      rerankScore: 0.9,
    });
    expect(evidence.graphScore).toBe(0.5);
  });

  it('defaults graph relevance to zero for fallback retrieval', () => {
    const evidence = evidenceSchema.parse({
      id: 'fallback',
      title: 'Public source',
      section: 'Safety',
      url: 'https://example.gov/safety',
      snippet: 'Safety planning comes first.',
      jurisdiction: 'United States',
      topic: 'safety',
      denseScore: 0.6,
      keywordScore: 0.4,
      fusionScore: 0.02,
      rerankScore: 0.8,
    });
    expect(evidence.graphScore).toBe(0);
  });
});
