import { describe, expect, it } from 'vitest';

import { issueApprovalToken, verifyApprovalToken } from '@/lib/approval';
import { privacyMinimizedCheckpoint } from '@/lib/d1-checkpointer';
import { fetchWithPolicy } from '@/lib/http';
import { portableInterrupt } from '@/lib/workflow';
import { GraphInterrupt } from '@langchain/langgraph';

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
