'use client';

import { useCallback, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ExternalLink,
  FileDiff,
  Globe2,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { TurnstileGate } from '@/components/turnstile-gate';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

type Result = {
  title: string;
  url: string;
  description: string;
  publishedAt?: string | null;
};
type Assessment = {
  candidates: Array<{
    result_index: number;
    materiality: 'low' | 'medium' | 'high';
    themes: string[];
    rationale: string;
    matching_source_ids: string[];
    suggested_action:
      | 'monitor'
      | 'compare_full_text'
      | 'priority_curator_review';
  }>;
  portfolio_summary: string;
};

export function PolicyMonitor() {
  const [query, setQuery] = useState(
    'Colorado restorative justice victim participation privacy youth safety updated guidance',
  );
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [timeline, setTimeline] = useState<
    Array<{ label: string; detail: string; durationMs: number }>
  >([]);
  const [traceId, setTraceId] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const handleTurnstile = useCallback(
    (token: string) => setTurnstileToken(token),
    [],
  );

  async function runMonitor() {
    setRunning(true);
    setError('');
    setResults([]);
    setAssessment(null);
    setTimeline([]);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const body = (await response.json()) as {
        results?: Result[];
        assessment?: Assessment | null;
        timeline?: typeof timeline;
        traceId?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(body.error || 'Policy monitor stopped safely.');
      setResults(body.results || []);
      setAssessment(body.assessment || null);
      setTimeline(body.timeline || []);
      setTraceId(body.traceId || '');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Policy monitor stopped safely.',
      );
    } finally {
      setRunning(false);
      setTurnstileToken('');
      setTurnstileReset((value) => value + 1);
    }
  }

  return (
    <section aria-label="Policy change monitor">
      <div className="mb-5 max-w-4xl">
        <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-primary">
          <Sparkles className="size-3.5" /> Agentic corpus governance
        </p>
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
          Find possible public-guidance changes before they become stale
          answers.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          You.com searches only approved public domains. A Fireworks triage
          agent compares result metadata with the current corpus catalog. Every
          result remains advisory until a curator opens and verifies the full
          source.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Monitor topic</CardTitle>
            <CardDescription>
              Use policy topics only—never names, case numbers, or real incident
              details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-32 bg-muted/20 leading-6"
            />
            <TurnstileGate
              onToken={handleTurnstile}
              resetKey={turnstileReset}
              action="public_research"
            />
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={runMonitor}
              disabled={running || query.trim().length < 10}
            >
              {running ? <RefreshCw className="animate-spin" /> : <Globe2 />}
              {running
                ? 'Discovering and triaging…'
                : 'Run policy intelligence workflow'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-slate-800 bg-slate-950 text-white">
          <CardHeader>
            <CardTitle className="text-white">
              Observable monitor workflow
            </CardTitle>
            <CardDescription className="text-slate-400">
              Search snippets are treated as untrusted data and can never update
              production evidence automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length ? (
              <ol className="space-y-2">
                {timeline.map((event, index) => (
                  <li
                    key={`${event.label}-${index}`}
                    className="flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-400 text-slate-950">
                      <Check className="size-4" />
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between gap-3">
                        <p className="text-xs font-semibold">{event.label}</p>
                        <span className="font-mono text-[9px] text-slate-400">
                          {event.durationMs} ms
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] leading-4 text-slate-400">
                        {event.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-6 text-center">
                <div>
                  <FileDiff className="mx-auto size-9 text-teal-300" />
                  <p className="mt-4 text-sm font-semibold">
                    Search → triage → curator review
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    The system may recommend a full-text comparison, but it
                    cannot publish or re-index a source.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          {traceId && (
            <CardFooter className="border-white/10 font-mono text-[10px] text-slate-400">
              {traceId}
            </CardFooter>
          )}
        </Card>
      </div>

      {error && (
        <Alert className="mt-5 border-amber-200 bg-amber-50 text-amber-950">
          <AlertTriangle />
          <AlertTitle>Monitor stopped safely</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {assessment && (
        <Alert className="mt-5 border-sky-200 bg-sky-50 text-sky-950">
          <SearchCheck />
          <AlertTitle>Portfolio-level triage</AlertTitle>
          <AlertDescription>{assessment.portfolio_summary}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {results.map((result, index) => {
            const candidate = assessment?.candidates.find(
              (item) => item.result_index === index,
            );
            const tone =
              candidate?.materiality === 'high'
                ? 'border-rose-300'
                : candidate?.materiality === 'medium'
                  ? 'border-amber-300'
                  : 'border-border/70';
            return (
              <Card key={result.url} className={`border ${tone}`}>
                <CardHeader>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge
                      variant={
                        candidate?.materiality === 'high'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {candidate
                        ? `${candidate.materiality} review priority`
                        : 'Discovery result'}
                    </Badge>
                    {candidate?.themes.map((theme) => (
                      <Badge key={theme} variant="secondary">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle>{result.title}</CardTitle>
                  <CardDescription>{result.description}</CardDescription>
                </CardHeader>
                {candidate && (
                  <CardContent>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {candidate.rationale}
                    </p>
                    <div className="mt-3 rounded-xl bg-muted/40 p-3 text-xs">
                      <strong>Recommended action:</strong>{' '}
                      {candidate.suggested_action.replaceAll('_', ' ')}
                    </div>
                    {candidate.matching_source_ids.length > 0 && (
                      <p className="mt-3 font-mono text-[10px] text-muted-foreground">
                        Compare with: {candidate.matching_source_ids.join(', ')}
                      </p>
                    )}
                  </CardContent>
                )}
                <CardFooter className="justify-between">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ShieldCheck className="size-3" /> Human verification
                    required
                  </span>
                  <a href={result.url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      Open source <ExternalLink />
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
