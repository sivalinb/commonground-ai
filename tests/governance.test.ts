import { describe, expect, it } from 'vitest';

import { issueApprovalToken, verifyApprovalToken } from '@/lib/approval';
import {
  analyzeRequestSchema,
  approvalRequestSchema,
  humanDecisionSchema,
} from '@/lib/contracts';
import { privacyMinimizedCheckpoint } from '@/lib/d1-checkpointer';
import { fetchWithPolicy } from '@/lib/http';
import { portableInterrupt } from '@/lib/workflow';
import { normalizePineconeHost } from '@/lib/workflow-runtime';
import { GraphInterrupt } from '@langchain/langgraph';
import evaluatorContract from '@/data/evaluator-contract.json';
import calibrationManifest from '@/data/human-calibration-manifest.json';

describe('signed reviewer sessions', () => {
  it('accepts a valid token bound to the approval id', async () => {
    const token = await issueApprovalToken('approval-a', 'test-secret', 1_000);
    await expect(
      verifyApprovalToken('approval-a', token, 'test-secret', 2_000),
    ).resolves.toBe(true);
  });

  it('rejects replay against a different approval id', async () => {
    const token = await issueApprovalToken('approval-a', 'test-secret', 1_000);
    await expect(
      verifyApprovalToken('approval-b', token, 'test-secret', 2_000),
    ).resolves.toBe(false);
  });

  it('rejects an expired reviewer session', async () => {
    const token = await issueApprovalToken('approval-a', 'test-secret', 1_000);
    await expect(
      verifyApprovalToken('approval-a', token, 'test-secret', 2_000_000),
    ).resolves.toBe(false);
  });
});

describe('production-style workflow boundaries', () => {
  it('requires an explicit training-only attestation', () => {
    expect(
      analyzeRequestSchema.safeParse({
        caseText: 'A fictional participant wants time before choosing.',
        jurisdiction: 'colorado',
      }).success,
    ).toBe(false);
    expect(
      analyzeRequestSchema.safeParse({
        caseText: 'A fictional participant wants time before choosing.',
        jurisdiction: 'colorado',
        trainingUseAcknowledged: true,
      }).success,
    ).toBe(true);
  });

  it('supports approve, revise, reject, and escalate decisions', () => {
    expect(
      ['approved', 'revision_requested', 'rejected', 'escalated'].every(
        (decision) => humanDecisionSchema.safeParse(decision).success,
      ),
    ).toBe(true);
  });

  it('requires a rationale for non-approval decisions', () => {
    const base = {
      approvalId: 'a305250b-e72f-4c54-a5bb-700591329d6a',
      approvalToken: 'x'.repeat(48),
      reviewerRole: 'supervisor' as const,
    };
    expect(
      approvalRequestSchema.safeParse({
        ...base,
        decision: 'rejected',
        comment: '',
      }).success,
    ).toBe(false);
    expect(
      approvalRequestSchema.safeParse({
        ...base,
        decision: 'escalated',
        comment: 'Requires supervisor policy review.',
      }).success,
    ).toBe(true);
  });
});

describe('privacy-minimized durable checkpoints', () => {
  it('removes narratives, vectors, evidence excerpts, and generated output', () => {
    const checkpoint = privacyMinimizedCheckpoint({
      v: 4,
      id: 'checkpoint-1',
      ts: new Date(0).toISOString(),
      channel_values: {
        caseText: 'A private fictional narrative',
        queryVector: [0.1, 0.2],
        candidates: [{ snippet: 'source' }],
        evidence: [{ snippet: 'evidence' }],
        brief: { finding: 'generated' },
        safetyReview: { approved: true },
        crossModelReview: { approved: true },
        approvalId: 'approval-a',
        approvalRequired: true,
        'branch:to:human_approval': 'human_approval',
      },
      channel_versions: {},
      versions_seen: {},
    });
    expect(checkpoint.channel_values).toMatchObject({
      caseText: '[not persisted]',
      queryVector: [],
      candidates: [],
      evidence: [],
      brief: null,
      safetyReview: null,
      crossModelReview: null,
      approvalId: 'approval-a',
      approvalRequired: true,
      'branch:to:human_approval': 'human_approval',
    });
  });
});

describe('provider retry policy', () => {
  it('normalizes Pinecone hosts supplied as either hostnames or URLs', () => {
    expect(normalizePineconeHost('index.example.pinecone.io')).toBe(
      'index.example.pinecone.io',
    );
    expect(normalizePineconeHost('https://index.example.pinecone.io/')).toBe(
      'index.example.pinecone.io',
    );
  });

  it('retries transient server errors', async () => {
    let calls = 0;
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response('', { status: calls === 1 ? 503 : 200 });
    };
    try {
      const response = await fetchWithPolicy(
        'https://provider.example/test',
        {},
        { label: 'provider', retries: 1, timeoutMs: 1000 },
      );
      expect(response.status).toBe(200);
      expect(calls).toBe(2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('does not retry a deterministic client error', async () => {
    let calls = 0;
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      calls += 1;
      return new Response('', { status: 400 });
    };
    try {
      const response = await fetchWithPolicy(
        'https://provider.example/test',
        {},
        { label: 'provider', retries: 2, timeoutMs: 1000 },
      );
      expect(response.status).toBe(400);
      expect(calls).toBe(1);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('portable LangGraph approval interrupt', () => {
  it('emits a graph interrupt without AsyncLocalStorage', () => {
    const config = {
      configurable: {
        __pregel_checkpointer: {},
        __pregel_scratchpad: {
          interruptCounter: -1,
          resume: [],
          consumeNullResume: () => undefined,
        },
      },
    };
    expect(() =>
      portableInterrupt({ approvalId: 'approval-a' }, config),
    ).toThrow(GraphInterrupt);
  });

  it('consumes the durable Command resume value', () => {
    let consumed = false;
    const scratchpad = {
      interruptCounter: -1,
      resume: [] as unknown[],
      nullResume: 'approved' as string | undefined,
      consumeNullResume: () => {
        consumed = true;
        scratchpad.nullResume = undefined;
        return 'approved';
      },
    };
    const decision = portableInterrupt<unknown, string>(
      { approvalId: 'approval-a' },
      {
        configurable: {
          __pregel_checkpointer: {},
          __pregel_scratchpad: scratchpad,
        },
      },
    );
    expect(decision).toBe('approved');
    expect(consumed).toBe(true);
    expect(scratchpad.resume).toEqual(['approved']);
  });
});

describe('evaluation governance contract', () => {
  it('uses independent code, model-judge, and human-review layers', () => {
    expect(evaluatorContract.architecture.map((layer) => layer.id)).toEqual([
      'code',
      'judge',
      'human',
    ]);
    expect(evaluatorContract.releaseGate.criticalSafetyVeto).toBe(true);
  });

  it('requires perfect critical-case human agreement and zero false-safe cases', () => {
    expect(
      calibrationManifest.reviewerTarget.criticalCaseAgreementPercent,
    ).toBe(100);
    expect(calibrationManifest.reviewerTarget.falseSafeCount).toBe(0);
  });

  it('prepares a blinded, stratified 30-case calibration sample', () => {
    expect(calibrationManifest.sampleSize).toBe(30);
    expect(calibrationManifest.distribution).toEqual({
      happy_path: 15,
      edge_case: 9,
      known_failure: 4,
      adversarial: 2,
    });
    expect(
      Object.values(calibrationManifest.requiredCoverage).every(Boolean),
    ).toBe(true);
  });
});
