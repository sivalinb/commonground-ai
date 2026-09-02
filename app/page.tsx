'use client';

/* oxlint-disable next/no-html-link-for-pages */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  Database,
  ExternalLink,
  FileSearch,
  GitBranch,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Info,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  Network,
  Play,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Waypoints,
  Zap,
} from 'lucide-react';

import { TurnstileGate } from '@/components/turnstile-gate';
import { KnowledgeMap } from '@/components/knowledge-map';
import { PolicyMonitor } from '@/components/policy-monitor';
import { PracticeLab } from '@/components/practice-lab';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import knowledge from '@/data/knowledge.json';

type View =
  | 'home'
  | 'workspace'
  | 'practice'
  | 'evidence'
  | 'evals'
  | 'trace'
  | 'monitor'
  | 'map'
  | 'sources'
  | 'architecture'
  | 'course';
type ScenarioKey = 'autonomy' | 'youth' | 'unsupported';
type Citation = {
  id: string;
  title: string;
  section: string;
  url: string;
  snippet: string;
  jurisdiction: string;
  topic: string;
  denseScore: number;
  keywordScore: number;
  fusionScore: number;
  graphScore: number;
  rerankScore: number;
};
type CitedText = { text: string; citation_ids: string[] };
type TimelineEvent = {
  stage: string;
  label: string;
  status: 'passed' | 'stopped' | 'waiting';
  durationMs: number;
  detail: string;
};
type LiveResult = {
  traceId: string;
  approvalId?: string;
  approvalToken?: string;
  approvalStatus:
    | 'not_required'
    | 'pending'
    | 'approved'
    | 'revision_requested'
    | 'rejected'
    | 'escalated';
  awaitingApproval: boolean;
  finding: CitedText;
  options: CitedText[];
  safeguards: CitedText[];
  citations: Citation[];
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
  turnstileConfigured: boolean;
};
type EvalReport = {
  dataset: string;
  mode: 'preflight' | 'live';
  generatedAt: string | null;
  total: number;
  passed: number;
  metrics: Record<string, number | null>;
  note: string;
  categories: Array<{ label: string; count: number }>;
  releaseThresholds: Record<string, number>;
  retrieval: {
    dataset: string;
    mode: string;
    total: number;
    passed: number;
    metrics: Record<string, number | null>;
    targets: Record<string, number>;
    note: string;
    ablation: null | {
      queryCount: number;
      vector: Record<string, number | null>;
      hybrid: Record<string, number | null>;
      graph: Record<string, number | null>;
    };
  };
  week4Dataset: {
    dataset: string;
    datasetVersion: string;
    total: number;
    distribution: Record<string, number>;
    cohorts: {
      providerBenchmarkCore: number;
      goldenExtension: number;
    };
    dispositions: Record<string, number>;
    criticalCases: number;
    referenceLabels: string;
    privacy: string;
    langsmith: {
      datasetId: string;
      datasetName: string;
      datasetUrl: string;
      versionTag: string;
      verifiedExampleCount: number;
    };
    evaluationStatus: {
      providerBackedCore: number;
      deterministicValidation: number;
      fullProviderRun: string;
      note: string;
    };
  };
  week4: {
    dataset: string;
    datasetVersion: string;
    generatedAt: string;
    mode: string;
    distribution: Record<string, number>;
    evaluatorSet: string[];
    baseline: Week4Experiment;
    improved: Week4Experiment;
    deltas: Record<string, number | null>;
    releaseGate: {
      passed: boolean;
      passBars: Record<string, number>;
    };
    targetedImprovements: Array<{
      id: string;
      hypothesis: string;
      implementation: string;
      measuredBy: string[];
    }>;
    monitoringPlan: Array<{
      signal: string;
      alertBelow?: number;
      alertAbove?: number;
    }>;
    langsmith: null | {
      datasetId: string;
      datasetName: string;
      datasetUrl: string;
      experiments: Record<string, string>;
    };
    limitations: string[];
  };
};

type Week4Experiment = {
  profile: string;
  experimentName: string;
  total: number;
  passed: number;
  metrics: Record<string, number | null>;
  topFailureClusters: Array<{
    cluster: string;
    count: number;
    estimatedCostUsd: number;
    exampleTraceIds: string[];
  }>;
};

const scenarios: Record<
  ScenarioKey,
  {
    label: string;
    eyebrow: string;
    prompt: string;
    icon: typeof HeartHandshake;
  }
> = {
  autonomy: {
    label: 'No-contact preference',
    eyebrow: 'Victim autonomy',
    prompt:
      'A community member affected by property damage wants answers and accountability, but does not want direct contact with the responsible person. The volunteer needs to explain possible restorative options without creating pressure to participate.',
    icon: HeartHandshake,
  },
  youth: {
    label: 'Youth digital harm',
    eyebrow: 'Youth safety',
    prompt:
      'A high-school student is being blamed by peers after a private image was shared without permission. A school partner asks what safety and victim-support steps should happen before any restorative option is discussed.',
    icon: ShieldAlert,
  },
  unsupported: {
    label: 'Prohibited decision',
    eyebrow: 'Safe refusal',
    prompt:
      'Decide whether the responsible person is genuinely remorseful and require the harmed person to attend a restorative conference.',
    icon: Scale,
  },
};

const graphSteps = [
  {
    stage: 'policy_request_gate',
    label: 'Policy gate',
    detail: 'No consequential decisions',
    icon: Scale,
  },
  {
    stage: 'embedding',
    label: 'Embedding',
    detail: 'Fireworks · 1024d',
    icon: BrainCircuit,
  },
  {
    stage: 'hybrid_retrieval',
    label: 'Hybrid retrieval',
    detail: 'Pinecone + BM25 + RRF',
    icon: FileSearch,
  },
  {
    stage: 'graph_expand',
    label: 'Graph expansion',
    detail: 'Neo4j safeguard paths',
    icon: Network,
  },
  {
    stage: 'rerank',
    label: 'Reranking',
    detail: 'Fireworks · top 5',
    icon: Layers3,
  },
  {
    stage: 'generation',
    label: 'Generation',
    detail: 'Claim-level citations',
    icon: Bot,
  },
  {
    stage: 'citation_gate',
    label: 'Citation gate',
    detail: 'Deterministic validation',
    icon: BookOpenCheck,
  },
  {
    stage: 'safety_review',
    label: 'Safety critic',
    detail: 'Release thresholds',
    icon: ShieldCheck,
  },
  {
    stage: 'cross_model_review',
    label: 'Model panel',
    detail: 'Mistral independent audit',
    icon: BrainCircuit,
  },
  {
    stage: 'human_approval',
    label: 'Human review',
    detail: 'Durable approval record',
    icon: UserCheck,
  },
];

const tabGroups: Array<{
  label: string;
  description: string;
  icon: typeof MessageSquareText;
  marker: string;
  activeClass: string;
  items: Array<[View, string, typeof MessageSquareText]>;
}> = [
  {
    label: 'Try the tools',
    description: 'Run a workflow or practice a response',
    icon: Play,
    marker: 'bg-teal-300',
    activeClass: 'border-teal-300/40 bg-teal-300/10 text-teal-50',
    items: [
      ['workspace', 'Live workflow', MessageSquareText],
      ['practice', 'AI practice lab', Bot],
    ],
  },
  {
    label: 'Safety & evidence',
    description: 'Inspect sources, safeguards, and quality',
    icon: ShieldCheck,
    marker: 'bg-amber-300',
    activeClass: 'border-amber-300/40 bg-amber-300/10 text-amber-50',
    items: [
      ['evidence', 'Evidence', BookOpenCheck],
      ['evals', 'AI evaluations', BarChart3],
      ['trace', 'AI trace', Activity],
      ['monitor', 'Policy monitor', Globe2],
      ['map', 'Knowledge map', Network],
    ],
  },
  {
    label: 'About the system',
    description: 'Explore sources, architecture, and proof',
    icon: Layers3,
    marker: 'bg-sky-300',
    activeClass: 'border-sky-300/40 bg-sky-300/10 text-sky-50',
    items: [
      ['sources', 'Public sources', Globe2],
      ['architecture', 'Architecture', Network],
      ['course', 'Project evidence', GraduationCap],
    ],
  },
];

function Score({ value }: { value: number }) {
  return (
    <span className="rounded-md bg-slate-950 px-2 py-1 font-mono text-[11px] font-semibold text-white">
      {value.toFixed(2)}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative mb-7 overflow-hidden rounded-[1.75rem] border border-white/70 bg-card/85 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
      <div
        className="absolute -right-10 -top-16 size-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative max-w-4xl">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          <span className="size-1.5 rounded-full bg-primary" /> {eyebrow}
        </p>
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.035em] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
          {description}
        </p>
      </div>
    </div>
  );
}

function SourceLinks({
  ids,
  citations,
}: {
  ids: string[];
  citations: Citation[];
}) {
  const selected = citations.filter((citation) => ids.includes(citation.id));
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {selected.map((citation) => (
        <a
          key={citation.id}
          href={citation.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-900 hover:border-sky-400"
        >
          {citation.id} <ExternalLink className="size-2.5" />
        </a>
      ))}
    </span>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>('home');
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('autonomy');
  const [caseText, setCaseText] = useState(scenarios.autonomy.prompt);
  const [jurisdiction, setJurisdiction] = useState<'colorado' | 'national'>(
    'colorado',
  );
  const [running, setRunning] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null);
  const [liveError, setLiveError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [approvalStatus, setApprovalStatus] =
    useState<LiveResult['approvalStatus']>('not_required');
  const [approvalComment, setApprovalComment] = useState('');
  const [reviewerRole, setReviewerRole] = useState('volunteer');
  const [savingApproval, setSavingApproval] = useState(false);
  const [evalReport, setEvalReport] = useState<EvalReport | null>(null);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState('');
  const [researchResults, setResearchResults] = useState<
    Array<{ title: string; url: string; description: string }>
  >([]);
  const [trainingUseAcknowledged, setTrainingUseAcknowledged] =
    useState(false);

  useEffect(() => {
    fetch('/api/evals')
      .then((response) => response.json() as Promise<EvalReport>)
      .then(setEvalReport)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView]);

  const handleTurnstile = useCallback(
    (token: string) => setTurnstileToken(token),
    [],
  );
  const timelineByStage = useMemo(
    () =>
      new Map(liveResult?.timeline.map((event) => [event.stage, event]) || []),
    [liveResult],
  );
  const activeTabGroup = tabGroups.find((group) =>
    group.items.some(([value]) => value === activeView),
  );

  function chooseScenario(key: ScenarioKey) {
    setScenarioKey(key);
    setCaseText(scenarios[key].prompt);
    setLiveResult(null);
    setLiveError('');
    setApprovalStatus('not_required');
  }

  async function runAnalysis() {
    setRunning(true);
    setLiveError('');
    setLiveResult(null);
    setApprovalStatus('not_required');
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseText,
          jurisdiction,
          trainingUseAcknowledged,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const result = (await response.json()) as LiveResult & { error?: string };
      if (!response.ok)
        throw new Error(result.error || 'Live analysis failed safely.');
      setLiveResult(result);
      setApprovalStatus(result.approvalStatus);
    } catch (error) {
      setLiveError(
        error instanceof Error ? error.message : 'Live analysis failed safely.',
      );
    } finally {
      setRunning(false);
      setTurnstileToken('');
      setTurnstileReset((value) => value + 1);
    }
  }

  async function submitApproval(
    decision:
      | 'approved'
      | 'revision_requested'
      | 'rejected'
      | 'escalated',
  ) {
    if (!liveResult?.approvalId || !liveResult.approvalToken) return;
    setSavingApproval(true);
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId: liveResult.approvalId,
          approvalToken: liveResult.approvalToken,
          decision,
          reviewerRole,
          comment: approvalComment,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || 'Approval could not be recorded.');
      setApprovalStatus(decision);
    } catch (error) {
      setLiveError(
        error instanceof Error
          ? error.message
          : 'Approval could not be recorded.',
      );
    } finally {
      setSavingApproval(false);
    }
  }

  async function runFreshnessResearch() {
    setResearching(true);
    setResearchError('');
    setResearchResults([]);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: caseText,
          trainingUseAcknowledged,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const result = (await response.json()) as {
        results?: Array<{ title: string; url: string; description: string }>;
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error || 'Research failed safely.');
      setResearchResults(result.results || []);
    } catch (error) {
      setResearchError(
        error instanceof Error ? error.message : 'Research failed safely.',
      );
    } finally {
      setResearching(false);
      setTurnstileToken('');
      setTurnstileReset((value) => value + 1);
    }
  }

  return (
    <main className="app-shell min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-xl transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/[0.97] text-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.8)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button
            onClick={() => setActiveView('home')}
            className="group flex items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal-300 to-emerald-400 text-slate-950 shadow-[0_8px_24px_-10px_rgba(45,212,191,0.9)] transition-transform group-hover:-rotate-3 group-hover:scale-105">
              <HeartHandshake className="size-5" />
            </span>
            <span>
              <span className="block font-heading text-[15px] font-semibold tracking-[-0.015em]">
                CommonGround AI
              </span>
              <span className="hidden text-[11px] text-slate-400 sm:block">
                Evidence-led · human-reviewed
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <Badge className="hidden border border-emerald-300/25 bg-emerald-300/10 text-emerald-100 md:inline-flex">
              <CircleDot className="animate-pulse" /> Live AI system
            </Badge>
            <a
              href="/trust"
              className="hidden rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-2 text-xs font-semibold text-teal-100 transition hover:bg-teal-300/20 sm:inline-flex"
            >
              <ShieldCheck className="mr-1.5 size-3.5" /> Trust center
            </a>
            <a
              href="https://github.com/sivalinb/commonground-ai"
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="outline"
                className="h-9 border-white/15 bg-white/[0.06] px-3 text-white hover:bg-white/10 hover:text-white"
              >
                <Code2 /> <span className="hidden sm:inline">Source code</span>
              </Button>
            </a>
          </div>
        </div>
        <nav
          className="border-t border-white/[0.07]"
          aria-label="Application sections"
        >
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1.5 px-3 py-1.5 sm:px-6">
            {tabGroups.map((group) => {
              const GroupIcon = group.icon;
              const isActive = group === activeTabGroup;
              return (
                <button
                  key={group.label}
                  type="button"
                  onClick={() => setActiveView(group.items[0][0])}
                  className={`group/category relative h-10 rounded-xl border px-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:px-3 ${
                    isActive
                      ? group.activeClass
                      : 'border-white/[0.07] bg-white/[0.025] text-slate-300 hover:border-white/15 hover:bg-white/[0.055] hover:text-white'
                  }`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-lg text-slate-950 ${group.marker}`}
                    >
                      <GroupIcon className="size-3.5" />
                    </span>
                    <span className="text-[10px] font-semibold leading-tight sm:text-[11px]">
                      {group.label}
                    </span>
                  </span>
                  {isActive && (
                    <span
                      className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full ${group.marker}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
          {activeTabGroup && (
            <div className="border-t border-white/[0.07] bg-black/20">
              <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-center gap-1.5 px-3 py-2 sm:px-6">
                <span className="mr-1 hidden items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-500 lg:flex">
                  <span
                    className={`size-1.5 rounded-full ${activeTabGroup.marker}`}
                  />
                  {activeTabGroup.label}
                </span>
                {activeTabGroup.items.map(([value, label, Icon]) => (
                  <Button
                    key={value}
                    variant="ghost"
                    onClick={() => setActiveView(value)}
                    className={`h-7 rounded-full px-2.5 text-[11px] sm:text-xs ${
                      activeView === value
                        ? 'bg-white text-slate-950 shadow-sm hover:bg-white hover:text-slate-950'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-current={activeView === value ? 'page' : undefined}
                  >
                    <Icon /> {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </nav>
        <div className="border-t border-amber-300/20 bg-amber-200 text-amber-950">
          <div className="mx-auto flex max-w-[1480px] items-center justify-center gap-2 px-4 py-1.5 text-center text-[10px] font-semibold sm:px-6">
            <LockKeyhole className="size-3 shrink-0" /> Controlled training
            pilot · fictional or de-identified information only · no automated
            decisions or agency actions
          </div>
        </div>
      </header>

      <div
        id="main-content"
        className="mx-auto max-w-[1480px] scroll-mt-32 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pt-8"
      >
        {activeView === 'home' && (
          <section aria-label="CommonGround AI overview" className="space-y-6">
            <div className="cg-hero relative overflow-hidden rounded-[2rem] border border-emerald-200/10 bg-[#06100f] text-white shadow-[0_34px_110px_-44px_rgba(6,78,70,0.72)]">
              <div
                className="cg-grid absolute inset-0 opacity-35"
                aria-hidden="true"
              />
              <div
                className="absolute -left-24 top-0 size-80 rounded-full bg-teal-400/15 blur-[90px]"
                aria-hidden="true"
              />
              <div
                className="absolute -right-24 bottom-0 size-96 rounded-full bg-amber-300/10 blur-[110px]"
                aria-hidden="true"
              />
              <div className="relative grid lg:min-h-[610px] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14 lg:px-14 xl:px-16">
                  <div className="mb-6 flex flex-wrap gap-2">
                    <Badge className="border border-teal-300/20 bg-teal-300/10 text-teal-100">
                      Human-led restorative practice
                    </Badge>
                    <Badge className="border border-white/10 bg-white/[0.05] text-slate-300">
                      Public evidence · visible safeguards
                    </Badge>
                  </div>
                  <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-teal-300">
                    <Sparkles className="size-3.5" /> AI that knows where to
                    stop
                  </p>
                  <h1 className="max-w-3xl font-heading text-[2.65rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[4.25rem]">
                    Safer options.
                    <span className="block bg-gradient-to-r from-teal-200 via-emerald-300 to-amber-200 bg-clip-text text-transparent">
                      Clear evidence.
                    </span>
                    Human control.
                  </h1>
                  <p className="mt-6 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                    Turn a fictional restorative-justice question into a cited,
                    trauma-aware practice brief—while participant choice and
                    every consequential decision stay with people.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button
                      size="lg"
                      onClick={() => setActiveView('workspace')}
                      className="h-12 rounded-full bg-teal-300 px-6 font-semibold text-slate-950 shadow-[0_12px_32px_-12px_rgba(45,212,191,0.75)] hover:bg-teal-200"
                    >
                      <Play /> Try the guided case
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() =>
                        document
                          .getElementById('how-it-works')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }
                      className="h-12 rounded-full border-white/15 bg-white/[0.05] px-6 text-white hover:bg-white/10 hover:text-white"
                    >
                      See the human journey <ChevronRight />
                    </Button>
                  </div>
                  <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3 text-teal-300" /> Fictional
                      scenarios only
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3 text-teal-300" /> No automated
                      case decisions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3 text-teal-300" /> Human approval
                      required
                    </span>
                  </div>
                </div>

                <figure className="relative mx-4 mb-4 min-h-[360px] overflow-hidden rounded-[1.5rem] border border-white/10 sm:mx-6 sm:mb-6 lg:m-5 lg:ml-0 lg:min-h-0">
                  <Image
                    src="/commonground-rj-hero-v4.jpg"
                    alt="A diverse, voluntary restorative-practice circle in a welcoming community room. A male facilitator with a clipboard and a victim-services advocate support participants while an open chair and pathway represent choice; a subtle evidence, privacy, and human-approval network illustrates CommonGround AI assisting the process."
                    fill
                    priority
                    sizes="(min-width: 1024px) 54vw, 100vw"
                    className="object-cover object-[center_72%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06100f] via-transparent to-slate-950/10" />
                  <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-2 sm:inset-x-6 sm:bottom-6 sm:grid-cols-4">
                    {[
                      ['01', 'Describe'],
                      ['02', 'Retrieve'],
                      ['03', 'Safeguard'],
                      ['04', 'Review'],
                    ].map(([number, label], index) => (
                      <div
                        key={number}
                        className={`rounded-xl border px-3 py-2.5 backdrop-blur-md ${
                          index === 3
                            ? 'border-amber-200/25 bg-amber-200/15'
                            : 'border-white/15 bg-slate-950/60'
                        }`}
                      >
                        <p className="font-mono text-[9px] text-teal-200">
                          {number}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold">{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-2 text-[10px] font-semibold backdrop-blur-md">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal-300 opacity-70" />
                      <span className="relative inline-flex size-2 rounded-full bg-teal-300" />
                    </span>
                    People remain authoritative
                  </div>
                </figure>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['200', 'golden evaluation cases', BarChart3],
                ['10', 'reviewed public sources', BookOpenCheck],
                ['0', 'automated case decisions', ShieldCheck],
                ['1', 'required human checkpoint', UserCheck],
              ].map(([value, label, Icon]) => (
                <div
                  key={label as string}
                  className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-950 text-teal-200 shadow-lg">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-mono text-2xl font-semibold tracking-tight">
                      {value as string}
                    </p>
                    <p className="text-[11px] leading-4 text-muted-foreground">
                      {label as string}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              id="how-it-works"
              className="scroll-mt-32 rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_24px_70px_-50px_rgba(15,23,42,0.6)] backdrop-blur sm:p-8 lg:p-10"
            >
              <div className="grid gap-8 lg:grid-cols-[minmax(260px,0.62fr)_minmax(0,1.38fr)] lg:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                    The real user flow
                  </p>
                  <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                    One question. Four visible boundaries.
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    The interface reveals only what matters at each moment.
                    Technical depth is available when the user chooses to
                    inspect it.
                  </p>
                </div>
                <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    [
                      '01',
                      'Describe',
                      'Use a fictional or de-identified scenario.',
                      MessageSquareText,
                    ],
                    [
                      '02',
                      'Ground',
                      'Find and rank approved public guidance.',
                      FileSearch,
                    ],
                    [
                      '03',
                      'Protect',
                      'Check privacy, citations, safety, and choice.',
                      ShieldCheck,
                    ],
                    [
                      '04',
                      'Review',
                      'A trained person approves, revises, or withholds.',
                      UserCheck,
                    ],
                  ].map(([number, label, detail, Icon], index) => (
                    <li
                      key={label as string}
                      className={`relative rounded-2xl border p-4 ${index === 3 ? 'border-amber-200 bg-amber-50/70' : 'border-border/70 bg-background/70'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                          {number as string}
                        </span>
                      </div>
                      <p className="mt-4 text-sm font-semibold">
                        {label as string}
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                        {detail as string}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {[
                {
                  eyebrow: 'Start here',
                  title: 'Try a protected practice case',
                  detail:
                    'Choose a scenario and watch evidence, safeguards, and human review unfold.',
                  action: 'Open live workflow',
                  view: 'workspace' as View,
                  icon: Play,
                  tone: 'from-teal-300/20 to-emerald-300/5',
                },
                {
                  eyebrow: 'Build trust',
                  title: 'Inspect every safety boundary',
                  detail:
                    'See privacy blocking, citation gates, model review, and the approval checkpoint.',
                  action: 'Explore AI safeguards',
                  view: 'architecture' as View,
                  icon: ShieldCheck,
                  tone: 'from-amber-300/20 to-orange-300/5',
                },
                {
                  eyebrow: 'See proof',
                  title: 'Review evaluation evidence',
                  detail:
                    'Explore the 200-case golden corpus and the provider-tested 40-case core.',
                  action: 'Open evaluation lab',
                  view: 'evals' as View,
                  icon: BarChart3,
                  tone: 'from-sky-300/20 to-cyan-300/5',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    type="button"
                    aria-label={item.action}
                    onClick={() => setActiveView(item.view)}
                    className="group overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950 text-left text-white shadow-[0_20px_60px_-42px_rgba(15,23,42,0.9)] transition-all hover:-translate-y-1 hover:border-teal-300/30 hover:shadow-xl"
                  >
                    <div className={`bg-gradient-to-br ${item.tone} p-6`}>
                      <div className="flex items-center justify-between">
                        <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.07] text-teal-200">
                          <Icon className="size-5" />
                        </span>
                        <ChevronRight className="size-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                      </div>
                      <p className="mt-6 text-[9px] font-bold uppercase tracking-[0.2em] text-teal-300">
                        {item.eyebrow}
                      </p>
                      <h3 className="mt-2 font-heading text-xl font-semibold tracking-[-0.025em]">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-xs leading-5 text-slate-400">
                        {item.detail}
                      </p>
                      <p className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-white">
                        {item.action} <ChevronRight className="size-3" />
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-[1.5rem] border border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-teal-50 p-5 sm:flex-row sm:items-center sm:px-7">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
                  <Info className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Training demonstration—not a case decision system
                  </p>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
                    Never determines guilt, credibility, remorse, diagnosis,
                    risk, eligibility, or mandatory participation. Use fictional
                    or thoroughly de-identified scenarios only.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setActiveView('architecture')}
                className="shrink-0 rounded-full bg-white"
              >
                Read the safety contract <ChevronRight />
              </Button>
            </div>
          </section>
        )}

        {activeView === 'workspace' && (
          <section aria-label="Live restorative justice workflow">
            <div className="hidden">
              <div className="mb-6 overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 text-white shadow-[0_28px_90px_-38px_rgba(15,23,42,0.8)]">
                <div className="grid xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <div className="relative flex flex-col justify-center px-6 py-9 sm:px-9 sm:py-12 xl:px-12 xl:py-14">
                    <div
                      className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.18),transparent_30rem),radial-gradient(circle_at_90%_85%,rgba(251,191,36,0.08),transparent_22rem)]"
                      aria-hidden="true"
                    />
                    <div className="relative">
                      <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.19em] text-teal-300">
                        <Sparkles className="size-3.5" /> Evidence before advice
                      </p>
                      <h1 className="max-w-2xl font-heading text-4xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-5xl lg:text-[3.4rem]">
                        Repair harm. Protect choice. Keep people in charge.
                      </h1>
                      <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                        CommonGround AI helps restorative-justice and
                        victim-services practitioners explore safer options
                        using public evidence, visible safeguards, and required
                        human review.
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2.5">
                        <Button
                          size="lg"
                          onClick={() =>
                            document
                              .getElementById('workflow-start')
                              ?.scrollIntoView({ behavior: 'smooth' })
                          }
                          className="h-10 rounded-full bg-teal-300 px-5 font-semibold text-slate-950 shadow-lg shadow-teal-950/20 hover:bg-teal-200"
                        >
                          <Play /> Try a guided scenario
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => setActiveView('architecture')}
                          className="h-10 rounded-full border-white/20 bg-white/[0.06] px-5 text-white hover:bg-white/10 hover:text-white"
                        >
                          See how the AI works <ChevronRight />
                        </Button>
                      </div>
                      <div className="mt-6 flex flex-wrap gap-2">
                        <Badge className="border border-teal-300/25 bg-teal-300/10 text-teal-100">
                          <HeartHandshake /> Voluntary participation
                        </Badge>
                        <Badge className="border border-sky-300/25 bg-sky-300/10 text-sky-100">
                          <ShieldCheck /> Safety and support
                        </Badge>
                        <Badge className="border border-amber-300/25 bg-amber-300/10 text-amber-100">
                          <UserCheck /> Human-approved guidance
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <figure className="relative min-h-80 overflow-hidden border-t border-white/10 xl:min-h-[500px] xl:border-l xl:border-t-0">
                    <Image
                      src="/commonground-rj-hero-v4.jpg"
                      alt="A diverse, voluntary restorative-practice circle in a welcoming community room. A male facilitator with a clipboard and a victim-services advocate support participants while an open chair and pathway represent choice; a subtle evidence, privacy, and human-approval network illustrates CommonGround AI assisting the process."
                      fill
                      priority
                      sizes="(min-width: 1280px) 55vw, 100vw"
                      className="object-cover transition-transform duration-700 hover:scale-[1.015]"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent px-6 pb-6 pt-24">
                      <p className="max-w-2xl text-xs leading-5 text-white/90 sm:text-sm">
                        <strong>
                          AI supports the practice—it does not run it.
                        </strong>{' '}
                        The people, their safety, and their choices remain
                        authoritative.
                      </p>
                    </div>
                  </figure>
                </div>
                <div className="grid border-t border-white/10 sm:grid-cols-3">
                  {[
                    [
                      'Restorative justice',
                      'Repair harm through voluntary, accountable, community-centered options.',
                      HeartHandshake,
                    ],
                    [
                      'Victim services',
                      'Prioritize safety, voice, privacy, advocacy, and continuing choice.',
                      ShieldCheck,
                    ],
                    [
                      'CommonGround AI',
                      'Find cited public guidance, test safeguards, and wait for a trained reviewer.',
                      BrainCircuit,
                    ],
                  ].map(([label, description, Icon], index) => (
                    <div
                      key={label as string}
                      className={`group flex gap-3 px-5 py-5 transition-colors hover:bg-white/[0.035] ${index ? 'border-t border-white/10 sm:border-l sm:border-t-0' : ''}`}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-teal-200 transition-transform group-hover:-translate-y-0.5">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {label as string}
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-slate-400">
                          {description as string}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6 rounded-[1.75rem] border border-border/70 bg-card/85 p-5 shadow-[0_18px_60px_-42px_rgba(15,23,42,0.5)] backdrop-blur sm:p-6">
                <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-primary">
                      A transparent path
                    </p>
                    <h2 className="mt-1 font-heading text-xl font-semibold tracking-[-0.03em] sm:text-2xl">
                      From a human question to a human decision
                    </h2>
                  </div>
                  <p className="max-w-lg text-xs leading-5 text-muted-foreground">
                    Every AI step is visible, evidence-backed, and bounded by
                    safeguards designed for restorative practice.
                  </p>
                </div>
                <ol className="grid gap-3 md:grid-cols-4">
                  {[
                    [
                      '01',
                      'Describe',
                      'Start with a fictional, de-identified practice scenario.',
                      MessageSquareText,
                    ],
                    [
                      '02',
                      'Find evidence',
                      'Retrieve and rank approved public guidance.',
                      FileSearch,
                    ],
                    [
                      '03',
                      'Test safeguards',
                      'Check citations, autonomy, safety, and boundaries.',
                      ShieldCheck,
                    ],
                    [
                      '04',
                      'Human review',
                      'A trained person approves, revises, or withholds.',
                      UserCheck,
                    ],
                  ].map(([number, label, detail, Icon], index) => (
                    <li
                      key={label as string}
                      className="group relative rounded-2xl border border-border/70 bg-background/75 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                    >
                      {index < 3 && (
                        <span
                          className="absolute -right-2.5 top-8 z-10 hidden size-5 place-items-center rounded-full border bg-card text-muted-foreground md:grid"
                          aria-hidden="true"
                        >
                          <ChevronRight className="size-3" />
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="size-4" />
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-muted-foreground">
                          {number as string}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold">
                        {label as string}
                      </p>
                      <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                        {detail as string}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <Alert className="mb-6 border-amber-200/80 bg-gradient-to-r from-amber-50 via-white to-teal-50 text-slate-950 shadow-sm">
                <Info className="text-amber-700" />
                <AlertTitle>
                  Before you begin · training demonstration
                </AlertTitle>
                <AlertDescription className="max-w-5xl text-slate-600">
                  Use fictional or thoroughly de-identified scenarios only. This
                  system retrieves public guidance and drafts options for
                  trained human review; it never determines guilt, credibility,
                  remorse, mental health, risk, legal eligibility, or mandatory
                  participation.
                </AlertDescription>
              </Alert>

              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Graphs', '2 workflows · 15 nodes', Waypoints],
                  ['Corpus', '10 public sources', Database],
                  ['Evaluation', '48 safety · 24 retrieval', BarChart3],
                  ['Privacy', 'Metadata-only traces', LockKeyhole],
                ].map(([label, value, Icon]) => (
                  <Card
                    key={label as string}
                    size="sm"
                    className="border border-border/70 bg-card/90 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.55)] transition-all hover:-translate-y-0.5 hover:border-primary/25"
                  >
                    <CardContent className="flex h-full items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {label as string}
                        </p>
                        <p className="mt-1 text-xs font-semibold">
                          {value as string}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <SectionHeading
              eyebrow="Guided practice workflow"
              title="Explore one scenario from evidence to human review."
              description="Choose a fictional case, run the protected agent workflow, and inspect only the evidence and safeguards needed at each step."
            />
            <div
              id="workflow-start"
              className="scroll-mt-32 grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]"
            >
              <div className="space-y-4">
                <Card className="border border-border/70 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.55)]">
                  <CardHeader className="border-b bg-gradient-to-r from-card to-primary/[0.04]">
                    <CardTitle>
                      1. Choose a fictional training scenario
                    </CardTitle>
                    <CardDescription>
                      Privacy screening runs before any external AI provider
                      receives text.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(Object.keys(scenarios) as ScenarioKey[]).map((key) => {
                        const item = scenarios[key];
                        const Icon = item.icon;
                        return (
                          <Button
                            key={key}
                            variant={
                              scenarioKey === key ? 'default' : 'outline'
                            }
                            onClick={() => chooseScenario(key)}
                            className="h-auto rounded-xl justify-start whitespace-normal px-3 py-3 text-left"
                          >
                            <Icon className="shrink-0" />
                            <span>
                              <span className="block text-[10px] opacity-70">
                                {item.eyebrow}
                              </span>
                              <span className="block text-xs font-semibold">
                                {item.label}
                              </span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                    <Textarea
                      value={caseText}
                      onChange={(event) => setCaseText(event.target.value)}
                      aria-label="Fictional case description"
                      className="min-h-44 resize-y bg-muted/20 p-4 leading-6"
                    />
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs leading-5 text-amber-950">
                      <input
                        type="checkbox"
                        checked={trainingUseAcknowledged}
                        onChange={(event) =>
                          setTrainingUseAcknowledged(event.target.checked)
                        }
                        className="mt-1 size-4 shrink-0 accent-teal-700"
                      />
                      <span>
                        I confirm this contains only fictional or properly
                        de-identified training information—no names, case
                        numbers, contact details, criminal-history data, or
                        confidential records.
                      </span>
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold">
                        Evidence jurisdiction
                        <select
                          value={jurisdiction}
                          onChange={(event) =>
                            setJurisdiction(
                              event.target.value as 'colorado' | 'national',
                            )
                          }
                          className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        >
                          <option value="colorado">
                            Colorado + national guidance
                          </option>
                          <option value="national">
                            National guidance only
                          </option>
                        </select>
                      </label>
                      <TurnstileGate
                        onToken={handleTurnstile}
                        resetKey={turnstileReset}
                        action="commonground_analysis"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                    <p className="text-[11px] leading-4 text-muted-foreground">
                      <LockKeyhole className="mr-1 inline size-3" /> No raw
                      narrative is stored in D1 or LangSmith.
                    </p>
                    <Button
                      size="lg"
                      onClick={runAnalysis}
                      disabled={
                        running ||
                        caseText.trim().length < 20 ||
                        !trainingUseAcknowledged
                      }
                      className="min-w-48 rounded-full"
                    >
                      {running ? (
                        <RefreshCw className="animate-spin" />
                      ) : (
                        <Play />
                      )}
                      {running ? 'Running guarded graph…' : 'Run live workflow'}
                    </Button>
                  </CardFooter>
                </Card>
                {liveError && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                    <AlertTriangle />
                    <AlertTitle>Workflow stopped safely</AlertTitle>
                    <AlertDescription>{liveError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Card className="border border-slate-800 bg-slate-950 text-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.85)]">
                <CardHeader className="border-b border-white/10">
                  <CardTitle className="text-white">
                    2. Observable LangGraph execution
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Every stage below corresponds to real backend code and a
                    metadata-only trace span.
                  </CardDescription>
                  <CardAction>
                    <Badge className="border border-white/15 bg-white/5 font-mono text-slate-200">
                      {liveResult?.traceId || 'ready'}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <ol className="grid gap-2 sm:grid-cols-2">
                    {graphSteps.map(
                      ({ stage, label, detail, icon: Icon }, index) => {
                        const event = timelineByStage.get(stage);
                        const waiting = event?.status === 'waiting';
                        const completed = event?.status === 'passed';
                        const stopped = event?.status === 'stopped';
                        return (
                          <li
                            key={stage}
                            className={`relative rounded-xl border p-3 transition-all ${completed ? 'border-emerald-400/30 bg-emerald-400/10' : waiting ? 'border-amber-300/40 bg-amber-300/10' : stopped ? 'border-rose-400/40 bg-rose-400/10' : running && index === 0 ? 'border-sky-300/40 bg-sky-300/10' : 'border-white/10 bg-white/[0.035]'}`}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={`grid size-9 shrink-0 place-items-center rounded-lg ${completed ? 'bg-emerald-400 text-slate-950' : waiting ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-sky-200'}`}
                              >
                                <Icon className="size-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold">
                                    {label}
                                  </p>
                                  <span className="font-mono text-[9px] text-slate-400">
                                    0{index + 1}
                                  </span>
                                </div>
                                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                                  {event?.detail || detail}
                                </p>
                                {event && (
                                  <p className="mt-1 font-mono text-[9px] text-slate-500">
                                    {event.durationMs} ms
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      },
                    )}
                  </ol>
                </CardContent>
                <CardFooter className="border-white/10 bg-white/[0.035]">
                  <p className="text-[11px] leading-5 text-slate-400">
                    The graph can stop at the policy, evidence, citation, or
                    safety gate. Nothing is sent, referred, or written to an
                    agency system.
                  </p>
                </CardFooter>
              </Card>
            </div>

            {liveResult && (
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <Card
                  className={`border shadow-xl shadow-slate-900/5 ${liveResult.abstained ? 'border-amber-300' : 'border-emerald-300'}`}
                >
                  <CardHeader
                    className={
                      liveResult.abstained
                        ? 'bg-amber-50/70'
                        : 'bg-emerald-50/70'
                    }
                  >
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge
                        className={
                          liveResult.abstained
                            ? 'bg-amber-700 text-white'
                            : 'bg-emerald-700 text-white'
                        }
                      >
                        {liveResult.abstained ? (
                          <ShieldAlert />
                        ) : (
                          <ShieldCheck />
                        )}
                        {liveResult.abstained
                          ? 'Safely withheld'
                          : 'Release gates passed'}
                      </Badge>
                      <Badge variant="outline">
                        {liveResult.citations.length} cited sources
                      </Badge>
                      <Badge variant="outline">
                        {Math.round(liveResult.groundingScore * 100)}% grounding
                      </Badge>
                      <Badge variant="outline">
                        {liveResult.graph.provider === 'neo4j'
                          ? `Neo4j · ${liveResult.graph.expandedCandidates} linked`
                          : 'Graph fallback'}
                      </Badge>
                      {liveResult.crossModelReview && (
                        <Badge variant="outline">
                          Mistral panel ·{' '}
                          {liveResult.crossModelReview.approved
                            ? 'passed'
                            : 'withheld'}
                        </Badge>
                      )}
                    </div>
                    <CardTitle>3. Cited practice brief</CardTitle>
                    <CardDescription>
                      Every displayed source is explicitly selected by a
                      claim—not merely retrieved.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Safeguard finding
                      </p>
                      <p className="text-sm leading-6">
                        {liveResult.finding.text}
                      </p>
                      <SourceLinks
                        ids={liveResult.finding.citation_ids}
                        citations={liveResult.citations}
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Options for trained review
                      </p>
                      <ol className="space-y-2">
                        {liveResult.options.map((option, index) => (
                          <li
                            key={`${option.text}-${index}`}
                            className="rounded-xl border border-border bg-muted/20 p-3"
                          >
                            <div className="flex gap-3">
                              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                {index + 1}
                              </span>
                              <p className="text-sm leading-5">{option.text}</p>
                            </div>
                            <div className="ml-9">
                              <SourceLinks
                                ids={option.citation_ids}
                                citations={liveResult.citations}
                              />
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {liveResult.safeguards.map((item) => (
                        <div
                          key={item.text}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"
                        >
                          <span className="flex gap-2">
                            <Check className="mt-0.5 size-4 shrink-0" />
                            {item.text}
                          </span>
                          <SourceLinks
                            ids={item.citation_ids}
                            citations={liveResult.citations}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/70">
                  <CardHeader>
                    <CardTitle>4. Human approval checkpoint</CardTitle>
                    <CardDescription>
                      LangGraph is durably interrupted in D1 and resumes only
                      with this short-lived signed reviewer session. The
                      fictional narrative, vectors, evidence excerpts, and
                      generated brief are not persisted in the checkpoint.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {approvalStatus === 'pending' &&
                    liveResult.awaitingApproval ? (
                      <>
                        <label className="block text-xs font-semibold">
                          Reviewer role
                          <select
                            value={reviewerRole}
                            onChange={(event) =>
                              setReviewerRole(event.target.value)
                            }
                            className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                          >
                            <option value="volunteer">RJ volunteer</option>
                            <option value="facilitator">Facilitator</option>
                            <option value="victim_advocate">
                              Victim advocate
                            </option>
                            <option value="supervisor">Supervisor</option>
                            <option value="instructor">Instructor</option>
                          </select>
                        </label>
                        <label className="block text-xs font-semibold">
                          Review comment
                          <textarea
                            value={approvalComment}
                            onChange={(event) =>
                              setApprovalComment(event.target.value)
                            }
                            maxLength={500}
                            className="mt-1 min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm"
                            placeholder="Optional training feedback; do not enter case information."
                          />
                        </label>
                        <p className="text-[10px] leading-4 text-muted-foreground">
                          A rationale is required for revision, rejection, or
                          escalation. Decisions are recorded as metadata-only
                          audit events.
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            variant="outline"
                            disabled={
                              savingApproval ||
                              approvalComment.trim().length < 8
                            }
                            onClick={() => submitApproval('revision_requested')}
                          >
                            Request revision
                          </Button>
                          <Button
                            variant="outline"
                            disabled={
                              savingApproval ||
                              approvalComment.trim().length < 8
                            }
                            onClick={() => submitApproval('rejected')}
                          >
                            Reject brief
                          </Button>
                          <Button
                            variant="outline"
                            disabled={
                              savingApproval ||
                              approvalComment.trim().length < 8
                            }
                            onClick={() => submitApproval('escalated')}
                          >
                            Escalate to supervisor
                          </Button>
                          <Button
                            disabled={savingApproval}
                            onClick={() => submitApproval('approved')}
                          >
                            <UserCheck /> Approve training brief
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div
                        className={`rounded-xl border p-4 ${approvalStatus === 'approved' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
                      >
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          {approvalStatus === 'approved' ? (
                            <CheckCircle2 className="text-emerald-700" />
                          ) : (
                            <AlertTriangle className="text-amber-700" />
                          )}
                          {approvalStatus === 'approved'
                            ? 'Training brief approved'
                            : liveResult.abstained
                              ? 'No approval required for withheld output'
                              : approvalStatus === 'rejected'
                                ? 'Training brief rejected'
                                : approvalStatus === 'escalated'
                                  ? 'Escalated for supervisor review'
                                  : 'Revision requested'}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          No external action was taken. Trace{' '}
                          {liveResult.traceId.slice(0, 18)}…
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {liveResult.promptVersion} · {liveResult.corpusVersion}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {(liveResult.latencyMs / 1000).toFixed(2)} s
                    </span>
                  </CardFooter>
                </Card>
              </div>
            )}
          </section>
        )}

        {activeView === 'practice' && <PracticeLab />}

        {activeView === 'evidence' && (
          <section aria-label="Evidence explorer">
            <SectionHeading
              eyebrow="GraphRAG retrieval engineering"
              title="Inspect the exact evidence behind each claim."
              description="The live pipeline combines Pinecone semantic retrieval, local BM25, reciprocal-rank fusion, Neo4j relationship expansion, jurisdiction filters, and a Fireworks reranker before generation."
            />
            {!liveResult?.citations.length ? (
              <Alert>
                <Search />
                <AlertTitle>Run a live workflow first</AlertTitle>
                <AlertDescription>
                  The Evidence view displays only the sources and real scores
                  selected by the current analysis. The Public sources tab
                  contains the complete approved library.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {liveResult.citations.map((citation, index) => (
                  <Card key={citation.id} className="border border-border/70">
                    <CardHeader>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge>Rank {index + 1}</Badge>
                        <Badge variant="outline">{citation.jurisdiction}</Badge>
                        <Badge variant="outline">{citation.topic}</Badge>
                      </div>
                      <CardTitle>{citation.title}</CardTitle>
                      <CardDescription>{citation.section}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
                        {citation.snippet}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        {[
                          ['Dense', citation.denseScore],
                          ['BM25', citation.keywordScore],
                          ['RRF', citation.fusionScore],
                          ['Graph', citation.graphScore],
                          ['Rerank', citation.rerankScore],
                        ].map(([label, value]) => (
                          <div
                            key={label as string}
                            className="rounded-lg bg-muted/40 p-2"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                {label as string}
                              </span>
                              <Score value={value as number} />
                            </div>
                            <Progress
                              value={Math.min(
                                100,
                                (value as number) *
                                  (label === 'RRF' ? 2000 : 100),
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="justify-between">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {citation.id}
                      </span>
                      <a href={citation.url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline">
                          Open public source <ExternalLink />
                        </Button>
                      </a>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {activeView === 'evals' && (
          <section aria-label="Evaluation lab">
            <SectionHeading
              eyebrow="Versioned evaluation laboratory"
              title="200 golden cases. A provider-tested core. Every result scoped."
              description="LangSmith v2 contains 200 synthetic, de-identified cases with manually specified reference labels. Its 40-case benchmark core retains the frozen baseline-versus-improved provider experiments; all 200 cases pass deterministic schema, safety-trigger, source-ID, uniqueness, and distribution validation."
            />
            {evalReport?.week4 && evalReport.week4Dataset && (
              <div className="mb-6 space-y-5">
                <Card className="overflow-hidden border-teal-200 bg-gradient-to-br from-teal-50 via-background to-sky-50">
                  <CardHeader>
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge className="bg-teal-700 text-white">
                          LangSmith v{evalReport.week4Dataset.datasetVersion}
                        </Badge>
                        <Badge variant="outline">
                          {
                            evalReport.week4Dataset.langsmith
                              .verifiedExampleCount
                          }{' '}
                          examples verified
                        </Badge>
                      </div>
                      <CardTitle>200-case golden evaluation corpus</CardTitle>
                      <CardDescription className="mt-1 max-w-3xl">
                        {evalReport.week4Dataset.dataset} is an immutable v2
                        dataset:{' '}
                        {evalReport.week4Dataset.cohorts.providerBenchmarkCore}{' '}
                        provider-tested core cases plus{' '}
                        {evalReport.week4Dataset.cohorts.goldenExtension}{' '}
                        expanded coverage cases.
                      </CardDescription>
                    </div>
                    <CardAction>
                      <a
                        href={evalReport.week4Dataset.langsmith.datasetUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm">
                          Open 200 cases <ExternalLink />
                        </Button>
                      </a>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(evalReport.week4Dataset.distribution).map(
                      ([split, count]) => (
                        <div
                          key={split}
                          className="rounded-2xl border bg-background/80 p-4 shadow-sm"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-mono text-2xl font-semibold">
                              {count}
                            </span>
                            <span className="text-xs font-semibold text-teal-700">
                              {Math.round(
                                (count / evalReport.week4Dataset.total) * 100,
                              )}
                              %
                            </span>
                          </div>
                          <p className="mt-1 text-xs capitalize text-muted-foreground">
                            {split.replaceAll('_', ' ')}
                          </p>
                          <Progress
                            className="mt-3"
                            value={
                              (count / evalReport.week4Dataset.total) * 100
                            }
                          />
                        </div>
                      ),
                    )}
                    <div className="sm:col-span-2 xl:col-span-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-950">
                      <strong>Evidence boundary:</strong>{' '}
                      {
                        evalReport.week4Dataset.evaluationStatus
                          .providerBackedCore
                      }{' '}
                      cases have frozen provider-backed results; all{' '}
                      {
                        evalReport.week4Dataset.evaluationStatus
                          .deterministicValidation
                      }{' '}
                      are validated and versioned. The full 200-case provider
                      run remains a separate, explicitly reported experiment.
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden border-slate-800 bg-slate-950 text-white">
                  <CardHeader className="border-b border-white/10">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className="border border-teal-300/25 bg-teal-300/10 text-teal-100">
                          Evaluated core v{evalReport.week4.datasetVersion}
                        </Badge>
                        <Badge className="border border-sky-300/25 bg-sky-300/10 text-sky-100">
                          {evalReport.week4.mode}
                        </Badge>
                      </div>
                      <CardTitle className="text-white">
                        Baseline → post-improvement evidence
                      </CardTitle>
                      <CardDescription className="mt-1 text-slate-400">
                        {evalReport.week4.dataset} ·{' '}
                        {evalReport.week4.improved.total} identical cases per
                        experiment
                      </CardDescription>
                    </div>
                    <CardAction className="flex flex-col items-end gap-2">
                      <Badge
                        className={
                          evalReport.week4.releaseGate.passed
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-amber-300 text-slate-950'
                        }
                      >
                        {evalReport.week4.releaseGate.passed
                          ? 'Release gates passed'
                          : 'Measured gaps remain'}
                      </Badge>
                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href="https://github.com/sivalinb/commonground-ai/blob/main/data/week4-eval-report.json"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-semibold text-teal-200 hover:text-white"
                        >
                          Public result data ↗
                        </a>
                        {evalReport.week4.langsmith?.datasetUrl && (
                          <a
                            href={evalReport.week4.langsmith.datasetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-semibold text-sky-200 hover:text-white"
                          >
                            40-case experiment dataset ↗
                          </a>
                        )}
                      </div>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      ['safeTaskCompletion', 'Safe completion', '%'],
                      ['recallAt5', 'Recall@5', '%'],
                      ['claimFaithfulness', 'Faithfulness', '%'],
                      ['p95LatencyMs', 'P95 latency', 'ms'],
                    ].map(([key, label, unit]) => {
                      const baseline = evalReport.week4.baseline.metrics[key];
                      const improved = evalReport.week4.improved.metrics[key];
                      const delta = evalReport.week4.deltas[key];
                      const lowerIsBetter = key === 'p95LatencyMs';
                      const favorable =
                        typeof delta === 'number' &&
                        (lowerIsBetter ? delta <= 0 : delta >= 0);
                      return (
                        <div
                          key={key}
                          className="rounded-2xl border border-white/10 bg-white/[0.055] p-4"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            {label}
                          </p>
                          <div className="mt-3 flex items-end justify-between gap-3">
                            <div>
                              <p className="font-mono text-xs text-slate-400">
                                {baseline ?? '—'} {unit}
                              </p>
                              <p className="font-mono text-2xl font-semibold text-white">
                                {improved ?? '—'} {unit}
                              </p>
                            </div>
                            <Badge
                              className={
                                favorable
                                  ? 'bg-emerald-400/15 text-emerald-200'
                                  : 'bg-amber-300/15 text-amber-100'
                              }
                            >
                              {typeof delta === 'number'
                                ? `${delta > 0 ? '+' : ''}${delta}`
                                : '—'}
                            </Badge>
                          </div>
                          <p className="mt-2 text-[10px] text-slate-500">
                            baseline → improved
                          </p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Four tested improvements</CardTitle>
                      <CardDescription>
                        Each hypothesis is tied to a measurable output, not a
                        subjective feature claim.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      {evalReport.week4.targetedImprovements.map(
                        (improvement, index) => (
                          <div
                            key={improvement.id}
                            className="rounded-2xl border bg-muted/25 p-4"
                          >
                            <span className="mb-3 grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                              {index + 1}
                            </span>
                            <p className="text-sm font-semibold">
                              {improvement.implementation}
                            </p>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              {improvement.hypothesis}
                            </p>
                          </div>
                        ),
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Provider-tested core composition</CardTitle>
                      <CardDescription>
                        The original 40 cases remain the controlled comparison
                        set.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(evalReport.week4.distribution).map(
                        ([split, count]) => (
                          <div key={split}>
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                              <span className="font-medium">
                                {split.replaceAll('_', ' ')}
                              </span>
                              <span className="font-mono font-semibold">
                                {count} · {Math.round((count / 40) * 100)}%
                              </span>
                            </div>
                            <Progress value={(count / 40) * 100} />
                          </div>
                        ),
                      )}
                      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-950">
                        <strong>Evaluator panel:</strong> deterministic code,
                        independent Mistral judge, agent-trajectory checks, and
                        manually specified reference outcomes.
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                  {[
                    ['1', 'Define', 'Metrics, pass bars, labels, and case mix'],
                    [
                      '2',
                      'Instrument',
                      'Case-linked root traces and child spans',
                    ],
                    [
                      '3',
                      'Diagnose',
                      'Failure clusters, traces, latency, and cost',
                    ],
                    ['4', 'Improve', 'Same-dataset rerun with honest deltas'],
                  ].map(([number, title, detail]) => (
                    <div
                      key={number}
                      className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm"
                    >
                      <span className="font-mono text-xs font-bold text-primary">
                        PHASE {number}
                      </span>
                      <p className="mt-2 font-heading text-lg font-semibold">
                        {title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Post-improvement failure analysis</CardTitle>
                      <CardDescription>
                        Dominant clusters remain visible with case-linked trace
                        IDs and estimated failed-run cost.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {evalReport.week4.improved.topFailureClusters.length ? (
                        evalReport.week4.improved.topFailureClusters.map(
                          (cluster) => (
                            <div
                              key={cluster.cluster}
                              className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-amber-950">
                                  {cluster.cluster.replaceAll('_', ' ')}
                                </span>
                                <Badge variant="outline">
                                  {cluster.count} case
                                  {cluster.count === 1 ? '' : 's'}
                                </Badge>
                              </div>
                              <p className="mt-2 break-all font-mono text-[10px] text-amber-900/75">
                                {cluster.exampleTraceIds.join(', ') ||
                                  'Stopped before trace ingestion'}
                              </p>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-950">
                          No post-improvement failures were observed in this
                          experiment.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Production monitoring contract</CardTitle>
                      <CardDescription>
                        The same offline metrics become drift and operations
                        alerts after release.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 sm:grid-cols-2">
                      {evalReport.week4.monitoringPlan.map((monitor) => (
                        <div
                          key={monitor.signal}
                          className="flex items-center justify-between gap-2 rounded-xl border p-3"
                        >
                          <span className="text-[11px] font-medium">
                            {monitor.signal.replaceAll('_', ' ')}
                          </span>
                          <Badge variant="outline" className="font-mono">
                            {typeof monitor.alertBelow === 'number'
                              ? `< ${monitor.alertBelow}`
                              : `> ${monitor.alertAbove}`}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {evalReport?.categories.map((category) => (
                <Card key={category.label} size="sm">
                  <CardContent>
                    <p className="font-mono text-3xl font-semibold">
                      {category.count}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Latest executable report</CardTitle>
                  <CardDescription>
                    {evalReport?.dataset || 'Loading evaluation report'} ·{' '}
                    {evalReport?.mode || '—'} mode
                  </CardDescription>
                  <CardAction>
                    <Badge
                      className={
                        evalReport?.passed === evalReport?.total
                          ? 'bg-emerald-700 text-white'
                          : 'bg-amber-700 text-white'
                      }
                    >
                      {evalReport
                        ? `${evalReport.passed}/${evalReport.total} passed`
                        : 'Loading'}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3">
                  {evalReport &&
                    Object.entries(evalReport.metrics).map(([key, value]) => (
                      <div key={key}>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (letter) => letter.toUpperCase())}
                          </span>
                          <span className="font-mono text-xs font-semibold">
                            {value === null
                              ? 'Run live experiment'
                              : `${value}%`}
                          </span>
                        </div>
                        <Progress value={value || 0} />
                      </div>
                    ))}
                  <p className="rounded-xl bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
                    {evalReport?.note}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Release gates</CardTitle>
                  <CardDescription>
                    Changes should not ship when a critical threshold regresses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {evalReport &&
                    Object.entries(evalReport.releaseThresholds).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-xl border p-3"
                        >
                          <span className="flex items-center gap-2 text-xs font-medium">
                            <ShieldCheck className="size-4 text-emerald-700" />
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <Badge variant="outline">≥ {value}%</Badge>
                        </div>
                      ),
                    )}
                  <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900">
                    <strong>Dataset provenance:</strong> synthetic,
                    de-identified, version controlled, and safe to inspect in
                    the public repository.
                  </div>
                </CardContent>
              </Card>
            </div>
            {evalReport?.retrieval && (
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle>Retrieval-quality report</CardTitle>
                    <CardDescription>
                      {evalReport.retrieval.dataset} ·{' '}
                      {evalReport.retrieval.mode}
                    </CardDescription>
                    <CardAction>
                      <Badge
                        className={
                          evalReport.retrieval.passed ===
                          evalReport.retrieval.total
                            ? 'bg-emerald-700 text-white'
                            : 'bg-amber-700 text-white'
                        }
                      >
                        {evalReport.retrieval.passed}/
                        {evalReport.retrieval.total} passed
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(evalReport.retrieval.metrics).map(
                      ([key, value]) => (
                        <div key={key} className="rounded-xl border p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </p>
                          <p className="mt-1 font-mono text-xl font-semibold">
                            {value === null
                              ? 'Pending live run'
                              : key.toLowerCase().includes('latency')
                                ? `${value} ms`
                                : `${value}%`}
                          </p>
                        </div>
                      ),
                    )}
                    <p className="sm:col-span-2 rounded-xl bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
                      {evalReport.retrieval.note}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>RAG release targets</CardTitle>
                    <CardDescription>
                      Faithfulness, retrieval quality, abstention, and latency
                      are separate gates.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(evalReport.retrieval.targets).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-xl border p-3"
                        >
                          <span className="text-xs font-medium">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <Badge variant="outline">
                            {key.toLowerCase().includes('latency')
                              ? `≤ ${value} ms`
                              : `≥ ${value}%`}
                          </Badge>
                        </div>
                      ),
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </section>
        )}

        {activeView === 'trace' && (
          <section aria-label="Production trace">
            <SectionHeading
              eyebrow="LangSmith observability"
              title="Actual stage timings with metadata-only telemetry."
              description="Every provider or policy stage creates a child span. Raw narratives, generated brief text, and retrieved excerpts are deliberately excluded from LangSmith."
            />
            {!liveResult ? (
              <Alert>
                <Activity />
                <AlertTitle>No trace in this browser session yet</AlertTitle>
                <AlertDescription>
                  Run a live workflow to populate the real timeline, token
                  counts, latency, grounding score, and release-gate results.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle>Trace timeline</CardTitle>
                    <CardDescription className="font-mono">
                      {liveResult.traceId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="ml-3 border-l border-border pl-6">
                      {liveResult.timeline.map((event, index) => (
                        <li
                          key={`${event.stage}-${index}`}
                          className="relative pb-6 last:pb-0"
                        >
                          <span
                            className={`absolute -left-[2.15rem] grid size-7 place-items-center rounded-full border ${event.status === 'passed' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : event.status === 'waiting' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-rose-300 bg-rose-50 text-rose-700'}`}
                          >
                            {event.status === 'passed' ? (
                              <Check className="size-3.5" />
                            ) : event.status === 'waiting' ? (
                              <UserCheck className="size-3.5" />
                            ) : (
                              <AlertTriangle className="size-3.5" />
                            )}
                          </span>
                          <div className="flex flex-col justify-between gap-1 sm:flex-row">
                            <div>
                              <p className="text-sm font-semibold">
                                {event.label}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {event.detail}
                              </p>
                            </div>
                            <Badge variant="outline" className="font-mono">
                              {event.durationMs} ms
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Run signals</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[
                        [
                          'Total latency',
                          `${(liveResult.latencyMs / 1000).toFixed(2)} s`,
                          Clock3,
                        ],
                        [
                          'Model tokens',
                          String(
                            (liveResult.usage.generationTokens || 0) +
                              (liveResult.usage.criticTokens || 0) +
                              (liveResult.usage.mistralTokens || 0),
                          ),
                          Bot,
                        ],
                        [
                          'Graph-linked evidence',
                          String(liveResult.graph.expandedCandidates),
                          Network,
                        ],
                        [
                          'Cited evidence',
                          String(liveResult.citations.length),
                          BookOpenCheck,
                        ],
                        [
                          'Grounding',
                          `${Math.round(liveResult.groundingScore * 100)}%`,
                          ShieldCheck,
                        ],
                        ['Raw text logged', 'No', LockKeyhole],
                      ].map(([label, value, Icon]) => (
                        <div
                          key={label as string}
                          className="flex items-center justify-between rounded-xl border p-3"
                        >
                          <span className="flex items-center gap-2 text-xs">
                            <Icon className="size-4 text-primary" />
                            {label as string}
                          </span>
                          <span className="font-mono text-xs font-semibold">
                            {value as string}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
                    <ShieldCheck />
                    <AlertTitle>Privacy-minimized by design</AlertTitle>
                    <AlertDescription>
                      LangSmith receives counts, scores, versions, durations,
                      and status only.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}
          </section>
        )}

        {activeView === 'monitor' && <PolicyMonitor />}

        {activeView === 'map' && <KnowledgeMap />}

        {activeView === 'sources' && (
          <section aria-label="Approved public sources">
            <SectionHeading
              eyebrow="Public evidence library"
              title="Open every approved source for more information."
              description="The RAG corpus contains attributed summaries for retrieval. The links below lead to the original public materials; always review the authoritative source and current local policy."
            />
            <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {knowledge.map((source) => (
                <Card key={source.id} className="border border-border/70">
                  <CardHeader>
                    <div className="mb-2 flex gap-2">
                      <Badge variant="outline">{source.jurisdiction}</Badge>
                      <Badge variant="secondary">{source.topic}</Badge>
                    </div>
                    <CardTitle>{source.title}</CardTitle>
                    <CardDescription>{source.section}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {source.text}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <span className="font-mono text-[9px] text-muted-foreground">
                      Curated summary · {source.id}
                    </span>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        More information <ExternalLink />
                      </Button>
                    </a>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <Card className="border border-sky-200 bg-sky-50/60">
              <CardHeader>
                <CardTitle>Check for newer public guidance</CardTitle>
                <CardDescription>
                  You.com searches eight allowlisted government and
                  victim-service domains. Results remain advisory until a
                  curator reviews and approves them.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)]">
                <div className="space-y-3">
                  <label className="flex items-start gap-2 rounded-xl border border-sky-200 bg-white p-3 text-[11px] leading-4 text-sky-950">
                    <input
                      type="checkbox"
                      checked={trainingUseAcknowledged}
                      onChange={(event) =>
                        setTrainingUseAcknowledged(event.target.checked)
                      }
                      className="mt-0.5 size-4 shrink-0 accent-teal-700"
                    />
                    Search policy topics only; no real case or identifying
                    information.
                  </label>
                  <TurnstileGate
                    onToken={handleTurnstile}
                    resetKey={turnstileReset}
                    action="public_research"
                  />
                  <Button
                    variant="outline"
                    onClick={runFreshnessResearch}
                    disabled={researching || !trainingUseAcknowledged}
                    className="w-full"
                  >
                    {researching ? (
                      <RefreshCw className="animate-spin" />
                    ) : (
                      <Globe2 />
                    )}
                    {researching
                      ? 'Searching approved domains…'
                      : 'Search current public guidance'}
                  </Button>
                  {researchError && (
                    <p className="text-xs text-amber-800">{researchError}</p>
                  )}
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {researchResults.length ? (
                    researchResults.map((result) => (
                      <a
                        key={result.url}
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-sky-200 bg-white p-3 hover:border-sky-400"
                      >
                        <span className="flex items-start justify-between gap-2 text-xs font-semibold">
                          {result.title}
                          <ExternalLink className="size-3.5 shrink-0" />
                        </span>
                        <span className="mt-1 line-clamp-3 block text-[11px] leading-4 text-muted-foreground">
                          {result.description}
                        </span>
                      </a>
                    ))
                  ) : (
                    <div className="col-span-full grid min-h-28 place-items-center rounded-xl border border-dashed border-sky-200 bg-white/60 text-xs text-muted-foreground">
                      No curator-candidate results in this session.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {activeView === 'architecture' && (
          <section aria-label="Technical architecture">
            <SectionHeading
              eyebrow="Technical architecture"
              title="A production-minded AI system, not a chatbot wrapper."
              description="Each layer is independently testable and replaceable. The browser never receives Fireworks, Pinecone, Mistral, Deepgram, Neo4j, You.com, LangSmith, or Turnstile secret keys."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  title: 'Experience',
                  icon: MessageSquareText,
                  items: [
                    'React 19 + TypeScript',
                    'Tailwind + shadcn',
                    'Accessible working surface',
                  ],
                  tone: 'border-sky-200 bg-sky-50',
                },
                {
                  title: 'Orchestration',
                  icon: GitBranch,
                  items: [
                    'Two LangGraph workflows',
                    'Five specialized agents',
                    'Human checkpoint + D1 record',
                  ],
                  tone: 'border-violet-200 bg-violet-50',
                },
                {
                  title: 'Retrieval',
                  icon: Database,
                  items: [
                    'Pinecone dense search',
                    'BM25 lexical ranking',
                    'Neo4j graph expansion',
                  ],
                  tone: 'border-emerald-200 bg-emerald-50',
                },
                {
                  title: 'Models',
                  icon: BrainCircuit,
                  items: [
                    'Fireworks + Mistral panel',
                    'Schema-constrained agents',
                    'Cross-provider safety vote',
                  ],
                  tone: 'border-amber-200 bg-amber-50',
                },
                {
                  title: 'Intelligence',
                  icon: Globe2,
                  items: [
                    'You.com allowlist search',
                    'Deepgram Nova-3 + Aura-2',
                    'Neo4j Aura GraphRAG',
                  ],
                  tone: 'border-cyan-200 bg-cyan-50',
                },
                {
                  title: 'Assurance',
                  icon: ShieldCheck,
                  items: [
                    '200-case golden + 40-case tested core',
                    'Fairness + attack tests',
                    'LangSmith child spans',
                  ],
                  tone: 'border-rose-200 bg-rose-50',
                },
              ].map(({ title, icon: Icon, items, tone }) => (
                <div key={title} className="flex flex-col gap-3">
                  <Card
                    className={`h-full border shadow-[0_16px_42px_-34px_rgba(15,23,42,0.55)] transition-all hover:-translate-y-1 hover:shadow-xl ${tone}`}
                  >
                    <CardHeader>
                      <span className="mb-2 grid size-10 place-items-center rounded-xl bg-white/80">
                        <Icon className="size-5" />
                      </span>
                      <CardTitle>{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {items.map((item) => (
                        <p
                          key={item}
                          className="flex items-start gap-2 text-xs leading-5"
                        >
                          <Check className="mt-1 size-3 shrink-0" />
                          {item}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Fail-closed controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs leading-5 text-muted-foreground">
                  <p>
                    <ChevronRight className="mr-1 inline size-3 text-primary" />
                    Privacy and prohibited-decision rules run before AI calls.
                  </p>
                  <p>
                    <ChevronRight className="mr-1 inline size-3 text-primary" />
                    Low evidence, invalid citations, or safety failure withholds
                    output.
                  </p>
                  <p>
                    <ChevronRight className="mr-1 inline size-3 text-primary" />
                    Provider calls have timeouts and one bounded transient
                    retry.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Operational boundaries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs leading-5 text-muted-foreground">
                  <p>
                    <ChevronRight className="mr-1 inline size-3 text-primary" />
                    No eligibility, guilt, credibility, remorse, diagnosis, or
                    risk decisions.
                  </p>
                  <p>
                    <ChevronRight className="mr-1 inline size-3 text-primary" />
                    No automatic message, referral, or case-system update.
                  </p>
                  <p>
                    <ChevronRight className="mr-1 inline size-3 text-primary" />
                    Agency use requires local governance and security review.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Deployment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs leading-5 text-muted-foreground">
                  <p>
                    <Zap className="mr-1 inline size-3 text-primary" />
                    OpenAI Sites and Cloudflare Workers.
                  </p>
                  <p>
                    <Database className="mr-1 inline size-3 text-primary" />
                    D1 stores rate/approval metadata and a privacy-minimized
                    LangGraph control checkpoint.
                  </p>
                  <p>
                    <Code2 className="mr-1 inline size-3 text-primary" />
                    Public source, versioned prompts, corpus, migrations, and
                    evals.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {activeView === 'course' && (
          <section aria-label="Week 1 through Week 4 course evidence">
            <SectionHeading
              eyebrow="Cumulative course evidence"
              title="One project demonstrating four layers of applied AI learning."
              description="CommonGround AI progresses from a working AI application, to measurable hybrid RAG, to a durable LangGraph workflow, and finally to a controlled baseline-versus-improved evaluation experiment with LangSmith evidence."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  week: 'Week 1',
                  title: 'Vibe-coded data application',
                  score: 'Complete',
                  icon: Code2,
                  items: [
                    'AI-assisted implementation with Codex',
                    'Public interactive React application',
                    'Charts, workflow traces, filters, and evidence views',
                    'GitHub source and reproducible quality workflow',
                  ],
                },
                {
                  week: 'Week 2',
                  title: 'Evaluated hybrid RAG + GraphRAG',
                  score: 'Complete',
                  icon: Database,
                  items: [
                    'Fireworks embeddings and Pinecone vector storage',
                    'BM25, reciprocal-rank fusion, and reranking',
                    'Neo4j graph expansion and cited answers',
                    '24-query retrieval suite with declared release targets',
                  ],
                },
                {
                  week: 'Week 3',
                  title: 'Agentic AI system',
                  score: 'Complete',
                  icon: GitBranch,
                  items: [
                    'Five specialized practice agents and tool calls',
                    'Conditional state, retries, and safe stop paths',
                    'D1-backed LangGraph interrupt and resume',
                    'Signed reviewer session and metadata-only audit record',
                  ],
                },
                {
                  week: 'Week 4',
                  title: 'Agent evaluation and improvement',
                  score: 'Complete',
                  icon: BarChart3,
                  items: [
                    '200-case versioned LangSmith golden dataset',
                    'Code, LLM-judge, trajectory, and reference evaluators',
                    'Frozen baseline and identical post-improvement rerun',
                    'Failure clusters, trace IDs, latency, tokens, cost, and deltas',
                  ],
                },
              ].map(({ week, title, score, icon: Icon, items }) => (
                <Card key={week} className="border border-border/70">
                  <CardHeader>
                    <span className="mb-2 grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <CardTitle>{week}</CardTitle>
                    <CardDescription>{title}</CardDescription>
                    <CardAction>
                      <Badge className="bg-emerald-700 text-white">
                        <CheckCircle2 /> {score}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items.map((item) => (
                      <p
                        key={item}
                        className="flex items-start gap-2 text-xs leading-5"
                      >
                        <Check className="mt-1 size-3 shrink-0 text-emerald-700" />
                        {item}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Declared success criteria</CardTitle>
                  <CardDescription>
                    The project is judged on task completion and safe failure,
                    not whether a single model response sounds convincing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Recall@5', '94.2% · target ≥85%'],
                    ['Citation precision', '97% · target ≥95%'],
                    ['Claim faithfulness', '100% · target ≥90%'],
                    ['Correct abstention', '100% · target ≥90%'],
                    ['P95 latency', '7.93 s · target ≤15 s'],
                    ['Task success', '24/24 · 100%'],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <span className="text-xs font-medium">{label}</span>
                      <span className="font-mono text-xs font-semibold">
                        {value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-sky-200 bg-sky-50">
                <CardHeader>
                  <CardTitle>Submission package</CardTitle>
                  <CardDescription>
                    Public evidence for instructors and restorative-justice
                    reviewers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    ['Project report', 'docs/WEEK_1_3_PROJECT_REPORT.md'],
                    ['Evaluation method', 'docs/EVALUATION_METHODOLOGY.md'],
                    [
                      'Prompt and iteration log',
                      'docs/PROMPTS_AND_ITERATIONS.md',
                    ],
                    ['Five-minute demo guide', 'docs/FIVE_MINUTE_DEMO.md'],
                  ].map(([label, path]) => (
                    <a
                      key={path}
                      href={`https://github.com/sivalinb/commonground-ai/blob/main/${path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-sky-200 bg-white p-3 text-xs font-semibold hover:border-sky-400"
                    >
                      {label} <ExternalLink className="size-3.5" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </div>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-[1480px] gap-8 px-4 py-10 text-xs sm:px-6 md:grid-cols-[minmax(0,1.3fr)_minmax(220px,0.7fr)] lg:px-8">
          <div className="max-w-2xl">
            <span className="mb-4 grid size-11 place-items-center rounded-2xl bg-teal-300 text-slate-950">
              <HeartHandshake className="size-5" />
            </span>
            <p className="font-heading text-base font-semibold text-white">
              CommonGround AI
            </p>
            <p className="mt-2 max-w-xl leading-5 text-slate-400">
              Human judgment, victim choice, and approved policy remain
              authoritative. AI helps practitioners find evidence and examine
              safer options; it never replaces restorative relationships.
            </p>
          </div>
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Continue exploring
            </p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
              <a
                href="/trust"
                className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 transition-colors hover:border-teal-300/40 hover:bg-white/5 hover:text-white"
              >
                Trust center <ChevronRight className="size-3.5" />
              </a>
              <a
                href="/status"
                className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 transition-colors hover:border-teal-300/40 hover:bg-white/5 hover:text-white"
              >
                System status <ChevronRight className="size-3.5" />
              </a>
              <button
                onClick={() => setActiveView('sources')}
                className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 text-left transition-colors hover:border-teal-300/40 hover:bg-white/5 hover:text-white"
              >
                Public sources <ChevronRight className="size-3.5" />
              </button>
              <button
                onClick={() => setActiveView('evals')}
                className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 text-left transition-colors hover:border-teal-300/40 hover:bg-white/5 hover:text-white"
              >
                Evaluation evidence <ChevronRight className="size-3.5" />
              </button>
              <a
                href="https://github.com/sivalinb/commonground-ai"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 transition-colors hover:border-teal-300/40 hover:bg-white/5 hover:text-white"
              >
                GitHub repository <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.07]">
          <div className="mx-auto flex max-w-[1480px] flex-col gap-2 px-4 py-4 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>Training demonstration · Fictional scenarios only</span>
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="/security" className="hover:text-white">Security</a>
              <a href="/accessibility" className="hover:text-white">Accessibility</a>
              <a href="/limitations" className="hover:text-white">AI limitations</a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
