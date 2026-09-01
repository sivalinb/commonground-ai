import type { Evidence, PracticeBrief } from './contracts';

const sensitiveRules = [
  ['email address', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['phone number', /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/],
  ['case or report number', /\b(?:case|report|incident)\s*(?:number|no\.?|#)?\s*[:#-]?\s*[A-Z0-9-]{5,}\b/i],
  ['street address', /\b\d{1,6}\s+[A-Za-z0-9.' -]+\s(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Boulevard|Blvd)\b/i],
  ['social security number', /\b\d{3}-\d{2}-\d{4}\b/],
  ['date of birth', /\b(?:dob|date of birth|born)\s*[:#-]?\s*(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b/i],
  ['license plate', /\b(?:plate|license plate)\s*[:#-]?\s*[A-Z0-9]{5,8}\b/i],
  ['student identifier', /\b(?:student|juvenile|school)\s*(?:id|number|no\.?|#)\s*[:#-]?\s*[A-Z0-9-]{4,}\b/i],
] as const;

const prohibitedJudgmentPatterns = [
  /\b(?:is|seems|appears)\s+(?:genuinely\s+)?remorseful\b/i,
  /\b(?:is|seems|appears)\s+(?:not\s+)?credible\b/i,
  /\b(?:low|medium|high)\s+risk\b/i,
  /\bmust\s+(?:attend|participate|meet)\b/i,
  /\brequire(?:d)?\s+(?:the\s+)?(?:victim|harmed person).{0,30}(?:attend|participate|meet)\b/i,
  /\bdiagnos(?:e|is|ed)\b/i,
];

const prohibitedRequestPatterns = [
  /\b(?:decide|determine|assess|predict)\b.{0,80}\bremorse(?:ful)?\b/i,
  /\b(?:decide|determine|assess|predict)\b.{0,80}\bcredib(?:le|ility)\b/i,
  /\b(?:risk score|risk level|dangerousness)\b/i,
  /\b(?:decide|determine|make).{0,50}\b(?:final\s+)?(?:legal\s+)?eligib(?:le|ility)\b/i,
  /\b(?:require|force|order|make)\b.{0,60}\b(?:victim|harmed person|survivor)\b.{0,60}\b(?:attend|participate|meet)\b/i,
  /\bdiagnos(?:e|is)\b.{0,60}\b(?:mental|personality|disorder|condition)\b/i,
];

export function detectSensitiveData(value: string) {
  return sensitiveRules
    .filter(([, pattern]) => pattern.test(value))
    .map(([label]) => label);
}

export function containsProhibitedJudgment(value: string) {
  return prohibitedJudgmentPatterns.some((pattern) => pattern.test(value));
}

export function detectProhibitedRequest(value: string) {
  return prohibitedRequestPatterns.some((pattern) => pattern.test(value));
}

export function validateCitationUsage(brief: PracticeBrief, evidence: Evidence[]) {
  const allowed = new Set(evidence.map((item) => item.id));
  const claims = [brief.finding, ...brief.options, ...brief.safeguards];
  const invalidIds = claims.flatMap((claim) => claim.citation_ids).filter((id) => !allowed.has(id));
  const uncitedClaims = claims.filter((claim) => claim.citation_ids.length === 0).length;
  const selectedIds = [...new Set(claims.flatMap((claim) => claim.citation_ids))];
  return {
    valid: invalidIds.length === 0 && uncitedClaims === 0,
    invalidIds: [...new Set(invalidIds)],
    uncitedClaims,
    selectedIds,
  };
}

export function isEvidenceSufficient(evidence: Evidence[]) {
  const best = evidence[0];
  if (!best) return false;
  return best.rerankScore >= 0.12 && (best.denseScore >= 0.2 || best.keywordScore >= 0.08);
}

export function safeAbstention(reason: string, citationIds: string[] = []): PracticeBrief {
  return {
    finding: { text: reason, citation_ids: citationIds },
    options: [
      { text: 'Pause the automated analysis and preserve participant choice.', citation_ids: citationIds },
      { text: 'Consult approved local policy and a trained practitioner.', citation_ids: citationIds },
      { text: 'Document the unanswered question for corpus and supervisor review.', citation_ids: citationIds },
    ],
    safeguards: [
      { text: 'Abstention activated', citation_ids: citationIds },
      { text: 'No unsupported guidance', citation_ids: citationIds },
      { text: 'Human review required', citation_ids: citationIds },
    ],
    abstained: true,
  };
}
