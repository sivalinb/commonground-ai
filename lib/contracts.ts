import { z } from 'zod';

export const evidenceSchema = z.object({
  id: z.string(),
  title: z.string(),
  section: z.string(),
  url: z.url(),
  snippet: z.string(),
  jurisdiction: z.string(),
  topic: z.string(),
  denseScore: z.number().min(0).max(1),
  keywordScore: z.number().min(0).max(1),
  fusionScore: z.number().min(0),
  graphScore: z.number().min(0).max(1).default(0),
  rerankScore: z.number().min(0).max(1),
});

export const citedTextSchema = z.object({
  text: z.string().min(1),
  citation_ids: z.array(z.string()).min(1),
});

export const practiceBriefSchema = z.object({
  finding: citedTextSchema,
  options: z.array(citedTextSchema).length(3),
  safeguards: z.array(citedTextSchema).min(3).max(5),
  abstained: z.boolean(),
});

export const safetyReviewSchema = z.object({
  approved: z.boolean(),
  grounding_score: z.number().min(0).max(1),
  policy_scores: z.object({
    victim_autonomy: z.number().min(0).max(1),
    non_coercion: z.number().min(0).max(1),
    evidence_support: z.number().min(0).max(1),
  }),
  concerns: z.array(z.string()).max(3),
});

export const analyzeRequestSchema = z.object({
  caseText: z.string().trim().min(20).max(3000),
  jurisdiction: z.enum(['colorado', 'national']).default('colorado'),
  turnstileToken: z.string().max(2048).optional(),
  retrievalMode: z.enum(['vector', 'hybrid', 'graph']).optional(),
  evaluationProfile: z.enum(['baseline', 'improved']).optional(),
  evaluationContext: z
    .object({
      caseId: z.string().trim().min(1).max(100),
      datasetVersion: z.string().trim().min(1).max(100),
      experimentName: z.string().trim().min(1).max(120),
      expectedDisposition: z
        .enum(['answer', 'abstain', 'refuse', 'privacy_block'])
        .optional(),
      langsmithExampleId: z.uuid().optional(),
    })
    .optional(),
});

export const approvalRequestSchema = z.object({
  approvalId: z.uuid(),
  approvalToken: z.string().min(32).max(256),
  decision: z.enum(['approved', 'revision_requested']),
  reviewerRole: z.enum([
    'volunteer',
    'facilitator',
    'victim_advocate',
    'supervisor',
    'instructor',
  ]),
  comment: z.string().trim().max(500).default(''),
});

export type Evidence = z.infer<typeof evidenceSchema>;
export type CitedText = z.infer<typeof citedTextSchema>;
export type PracticeBrief = z.infer<typeof practiceBriefSchema>;
export type SafetyReview = z.infer<typeof safetyReviewSchema>;

export type TimelineEvent = {
  stage: string;
  label: string;
  status: 'passed' | 'stopped' | 'waiting';
  durationMs: number;
  detail: string;
};

export type PublicResult = {
  traceId: string;
  approvalId?: string;
  approvalToken?: string;
  approvalStatus:
    | 'not_required'
    | 'pending'
    | 'approved'
    | 'revision_requested';
  awaitingApproval: boolean;
  finding: CitedText;
  options: CitedText[];
  safeguards: CitedText[];
  citations: Evidence[];
  groundingScore: number;
  safetyApproved: boolean;
  safetyConcerns: string[];
  crossModelReview: {
    provider: 'mistral';
    model: string;
    approved: boolean;
    groundingScore: number;
    concerns: string[];
  } | null;
  graph: {
    provider: 'neo4j' | 'metadata';
    expandedCandidates: number;
    connectedIds: string[];
  };
  abstained: boolean;
  model: string;
  latencyMs: number;
  usage: {
    embeddingTokens: number | null;
    generationTokens: number | null;
    criticTokens: number | null;
    mistralTokens: number | null;
  };
  timeline: TimelineEvent[];
  promptVersion: string;
  corpusVersion: string;
};
