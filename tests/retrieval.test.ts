import { describe, expect, it } from 'vitest';

import { bm25Search, reciprocalRankFusion } from '@/lib/retrieval';

describe('hybrid retrieval', () => {
  it('ranks voluntary participation guidance for a choice query', () => {
    const results = bm25Search('voluntary participation choice harmed person');
    expect(results[0].document.topic).toBe('victim-autonomy');
    expect(results[0].normalizedScore).toBeGreaterThan(0);
  });

  it('fuses dense and lexical ranks', () => {
    const fused = reciprocalRankFusion(
      [
        { id: 'a', score: 0.9 },
        { id: 'b', score: 0.8 },
      ],
      [
        { id: 'b', score: 0.9 },
        { id: 'c', score: 0.8 },
      ],
    );
    expect(fused[0].id).toBe('b');
  });
});
