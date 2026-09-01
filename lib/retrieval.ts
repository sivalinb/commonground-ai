import knowledge from '@/data/knowledge.json';

export type KnowledgeDocument = (typeof knowledge)[number];

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'has',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'was',
  'were',
  'with',
]);

export function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function bm25Search(
  query: string,
  documents: KnowledgeDocument[] = knowledge,
) {
  const tokenized = documents.map((document) => tokenize(document.text));
  const queryTokens = [...new Set(tokenize(query))];
  const averageLength =
    tokenized.reduce((sum, tokens) => sum + tokens.length, 0) /
    Math.max(1, tokenized.length);
  const k1 = 1.2;
  const b = 0.75;
  const raw = documents.map((document, index) => {
    const tokens = tokenized[index];
    const score = queryTokens.reduce((total, term) => {
      const frequency = tokens.filter((token) => token === term).length;
      if (!frequency) return total;
      const containing = tokenized.filter((candidate) =>
        candidate.includes(term),
      ).length;
      const idf = Math.log(
        1 + (documents.length - containing + 0.5) / (containing + 0.5),
      );
      const normalized =
        (frequency * (k1 + 1)) /
        (frequency +
          k1 * (1 - b + b * (tokens.length / Math.max(1, averageLength))));
      return total + idf * normalized;
    }, 0);
    return { document, score };
  });
  const max = Math.max(...raw.map((item) => item.score), 1);
  return raw
    .map((item) => ({ ...item, normalizedScore: item.score / max }))
    .sort((a, bValue) => bValue.score - a.score);
}

export function reciprocalRankFusion(
  dense: Array<{ id: string; score: number }>,
  lexical: Array<{ id: string; score: number }>,
) {
  const scores = new Map<string, number>();
  const k = 60;
  dense.forEach((item, index) =>
    scores.set(item.id, (scores.get(item.id) || 0) + 1 / (k + index + 1)),
  );
  lexical.forEach((item, index) =>
    scores.set(item.id, (scores.get(item.id) || 0) + 1 / (k + index + 1)),
  );
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, bValue) => bValue.score - a.score);
}

export function getKnowledgeDocument(id: string) {
  return knowledge.find((document) => document.id === id);
}

export const approvedKnowledge = knowledge;
