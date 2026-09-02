'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

type Health = {
  status: 'operational' | 'degraded';
  environment: string;
  dataBoundary: string;
  externalActionsEnabled: boolean;
  checkedAt: string;
  release: string;
  services: Record<string, boolean>;
  notice: string;
};

const labels: Record<string, string> = {
  liveGeneration: 'Fireworks generation + Pinecone retrieval',
  independentSafetyReview: 'Mistral independent safety review',
  graphRetrieval: 'Neo4j GraphRAG expansion',
  voice: 'Deepgram voice services',
  observability: 'LangSmith metadata observability',
  freshnessResearch: 'You.com allowlisted research',
  abuseProtection: 'Cloudflare Turnstile enforcement',
  durableAuditMetadata: 'D1 durable audit metadata',
};

export function SystemStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) throw new Error('Health endpoint unavailable');
        return response.json() as Promise<Health>;
      })
      .then(setHealth)
      .catch(() => setError(true));
  }, []);

  if (error)
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <AlertTriangle className="mr-2 inline size-4" /> Status could not be
        loaded. No product action was taken.
      </div>
    );

  if (!health)
    return (
      <div className="flex items-center gap-2 rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        <RefreshCw className="size-4 animate-spin" /> Checking configuration…
      </div>
    );

  return (
    <div className="space-y-4" aria-live="polite">
      <div
        className={`rounded-2xl border p-5 ${
          health.status === 'operational'
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'
        }`}
      >
        <p className="flex items-center gap-2 text-sm font-semibold">
          {health.status === 'operational' ? (
            <CheckCircle2 className="size-5 text-emerald-700" />
          ) : (
            <AlertTriangle className="size-5 text-amber-700" />
          )}
          Public training demo: {health.status}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Release {health.release} · checked{' '}
          {new Date(health.checkedAt).toLocaleString()}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(health.services).map(([service, configured]) => (
          <div
            key={service}
            className="flex items-start gap-3 rounded-xl border bg-card p-4"
          >
            {configured ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
            )}
            <div>
              <p className="text-xs font-semibold">{labels[service] || service}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {configured ? 'Configured' : 'Not configured'}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-5 text-muted-foreground">
        {health.notice}
      </p>
    </div>
  );
}
