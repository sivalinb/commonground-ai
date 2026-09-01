'use client';

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
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import knowledge from '@/data/knowledge.json';

type View = 'workspace' | 'practice' | 'evidence' | 'evals' | 'trace' | 'monitor' | 'map' | 'sources' | 'architecture';
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
  rerankScore: number;
};
type CitedText = { text: string; citation_ids: string[] };
type TimelineEvent = { stage: string; label: string; status: 'passed' | 'stopped' | 'waiting'; durationMs: number; detail: string };
type LiveResult = {
  traceId: string;
  approvalId?: string;
  approvalStatus: 'not_required' | 'pending' | 'approved' | 'revision_requested';
  awaitingApproval: boolean;
  finding: CitedText;
  options: CitedText[];
  safeguards: CitedText[];
  citations: Citation[];
  groundingScore: number;
  safetyApproved: boolean;
  safetyConcerns: string[];
  abstained: boolean;
  model: string;
  latencyMs: number;
  usage: { embeddingTokens: number | null; generationTokens: number | null; criticTokens: number | null };
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
};

const scenarios: Record<ScenarioKey, { label: string; eyebrow: string; prompt: string; icon: typeof HeartHandshake }> = {
  autonomy: {
    label: 'No-contact preference',
    eyebrow: 'Victim autonomy',
    prompt: 'A community member affected by property damage wants answers and accountability, but does not want direct contact with the responsible person. The volunteer needs to explain possible restorative options without creating pressure to participate.',
    icon: HeartHandshake,
  },
  youth: {
    label: 'Youth digital harm',
    eyebrow: 'Youth safety',
    prompt: 'A high-school student is being blamed by peers after a private image was shared without permission. A school partner asks what safety and victim-support steps should happen before any restorative option is discussed.',
    icon: ShieldAlert,
  },
  unsupported: {
    label: 'Prohibited decision',
    eyebrow: 'Safe refusal',
    prompt: 'Decide whether the responsible person is genuinely remorseful and require the harmed person to attend a restorative conference.',
    icon: Scale,
  },
};

const graphSteps = [
  { stage: 'policy_request_gate', label: 'Policy gate', detail: 'No consequential decisions', icon: Scale },
  { stage: 'embedding', label: 'Embedding', detail: 'Fireworks · 1024d', icon: BrainCircuit },
  { stage: 'hybrid_retrieval', label: 'Hybrid retrieval', detail: 'Pinecone + BM25 + RRF', icon: FileSearch },
  { stage: 'rerank', label: 'Reranking', detail: 'Fireworks · top 5', icon: Layers3 },
  { stage: 'generation', label: 'Generation', detail: 'Claim-level citations', icon: Bot },
  { stage: 'citation_gate', label: 'Citation gate', detail: 'Deterministic validation', icon: BookOpenCheck },
  { stage: 'safety_review', label: 'Safety critic', detail: 'Release thresholds', icon: ShieldCheck },
  { stage: 'human_approval', label: 'Human review', detail: 'Durable approval record', icon: UserCheck },
];

const tabs: Array<[View, string, typeof MessageSquareText]> = [
  ['workspace', 'Live workflow', MessageSquareText],
  ['practice', 'AI practice lab', Bot],
  ['evidence', 'Evidence', BookOpenCheck],
  ['evals', 'Evaluations', BarChart3],
  ['trace', 'Trace', Activity],
  ['monitor', 'Policy monitor', Globe2],
  ['map', 'Knowledge map', Network],
  ['sources', 'Public sources', Globe2],
  ['architecture', 'Architecture', Network],
];

function Score({ value }: { value: number }) {
  return <span className="rounded-md bg-slate-950 px-2 py-1 font-mono text-[11px] font-semibold text-white">{value.toFixed(2)}</span>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mb-5 max-w-4xl">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.17em] text-primary">{eyebrow}</p>
      <h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function SourceLinks({ ids, citations }: { ids: string[]; citations: Citation[] }) {
  const selected = citations.filter((citation) => ids.includes(citation.id));
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {selected.map((citation) => (
        <a key={citation.id} href={citation.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-900 hover:border-sky-400">
          {citation.id} <ExternalLink className="size-2.5" />
        </a>
      ))}
    </span>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>('workspace');
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('autonomy');
  const [caseText, setCaseText] = useState(scenarios.autonomy.prompt);
  const [jurisdiction, setJurisdiction] = useState<'colorado' | 'national'>('colorado');
  const [running, setRunning] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null);
  const [liveError, setLiveError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [approvalStatus, setApprovalStatus] = useState<LiveResult['approvalStatus']>('not_required');
  const [approvalComment, setApprovalComment] = useState('');
  const [reviewerRole, setReviewerRole] = useState('volunteer');
  const [savingApproval, setSavingApproval] = useState(false);
  const [evalReport, setEvalReport] = useState<EvalReport | null>(null);
  const [researching, setResearching] = useState(false);
  const [researchError, setResearchError] = useState('');
  const [researchResults, setResearchResults] = useState<Array<{ title: string; url: string; description: string }>>([]);

  useEffect(() => {
    fetch('/api/evals')
      .then((response) => response.json() as Promise<EvalReport>)
      .then(setEvalReport)
      .catch(() => undefined);
  }, []);

  const handleTurnstile = useCallback((token: string) => setTurnstileToken(token), []);
  const timelineByStage = useMemo(() => new Map(liveResult?.timeline.map((event) => [event.stage, event]) || []), [liveResult]);

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
        body: JSON.stringify({ caseText, jurisdiction, turnstileToken: turnstileToken || undefined }),
      });
      const result = await response.json() as LiveResult & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Live analysis failed safely.');
      setLiveResult(result);
      setApprovalStatus(result.approvalStatus);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Live analysis failed safely.');
    } finally {
      setRunning(false);
      setTurnstileToken('');
      setTurnstileReset((value) => value + 1);
    }
  }

  async function submitApproval(decision: 'approved' | 'revision_requested') {
    if (!liveResult?.approvalId) return;
    setSavingApproval(true);
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId: liveResult.approvalId, decision, reviewerRole, comment: approvalComment }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Approval could not be recorded.');
      setApprovalStatus(decision);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Approval could not be recorded.');
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
        body: JSON.stringify({ query: caseText, turnstileToken: turnstileToken || undefined }),
      });
      const result = await response.json() as { results?: Array<{ title: string; url: string; description: string }>; error?: string };
      if (!response.ok) throw new Error(result.error || 'Research failed safely.');
      setResearchResults(result.results || []);
    } catch (error) {
      setResearchError(error instanceof Error ? error.message : 'Research failed safely.');
    } finally {
      setResearching(false);
      setTurnstileToken('');
      setTurnstileReset((value) => value + 1);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-slate-900/10 bg-slate-950/95 text-white shadow-lg shadow-slate-950/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1580px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => setActiveView('workspace')} className="flex items-center gap-3 text-left">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-400 text-slate-950 shadow-inner"><HeartHandshake className="size-5" /></span>
            <span><span className="block font-heading text-[15px] font-semibold">CommonGround AI</span><span className="hidden text-[11px] text-slate-300 sm:block">Victim-centered practice intelligence</span></span>
          </button>
          <div className="flex items-center gap-2">
            <Badge className="hidden border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 md:inline-flex"><CircleDot /> Live RAG</Badge>
            <a href="https://github.com/sivalinb/commonground-ai" target="_blank" rel="noreferrer"><Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Code2 /> Source code</Button></a>
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-card/80">
        <div className="mx-auto flex max-w-[1580px] gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8" aria-label="Application sections">
          {tabs.map(([value, label, Icon]) => (
            <Button key={value} variant={activeView === value ? 'default' : 'ghost'} onClick={() => setActiveView(value)} className="shrink-0 px-3" aria-current={activeView === value ? 'page' : undefined}><Icon /> {label}</Button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1580px] px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <Alert className="mb-5 border-sky-200 bg-gradient-to-r from-sky-50 to-teal-50 text-sky-950">
          <Info /><AlertTitle>Training and portfolio demonstration</AlertTitle>
          <AlertDescription className="text-sky-900/75">Use fictional or thoroughly de-identified scenarios only. This system retrieves public guidance and drafts options for trained human review; it never determines guilt, credibility, remorse, mental health, risk, legal eligibility, or mandatory participation.</AlertDescription>
        </Alert>

        {activeView === 'workspace' && (
          <section aria-label="Live restorative justice workflow">
            <div className="mb-5 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-slate-950/15">
              <div className="grid xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
                <div className="relative flex flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 xl:px-12">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.16),transparent_34rem)]" aria-hidden="true" />
                  <div className="relative">
                    <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-300"><Sparkles className="size-3.5" /> Evidence before advice</p>
                    <h1 className="max-w-2xl font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">Repair harm. Protect choice. Keep people in charge.</h1>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">CommonGround AI helps restorative-justice and victim-services practitioners explore safer options using public evidence, visible safeguards, and required human review.</p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Badge className="border border-teal-300/25 bg-teal-300/10 text-teal-100"><HeartHandshake /> Voluntary participation</Badge>
                      <Badge className="border border-sky-300/25 bg-sky-300/10 text-sky-100"><ShieldCheck /> Safety and support</Badge>
                      <Badge className="border border-amber-300/25 bg-amber-300/10 text-amber-100"><UserCheck /> Human-approved guidance</Badge>
                    </div>
                  </div>
                </div>
                <figure className="relative min-h-72 overflow-hidden border-t border-white/10 xl:min-h-[410px] xl:border-l xl:border-t-0">
                  <Image src="/commonground-rj-hero-v1.jpg" alt="A diverse, voluntary restorative-practice circle in a welcoming community room. A facilitator and victim-services advocate support participants while an open chair and pathway represent choice; a subtle evidence, privacy, and human-approval network illustrates CommonGround AI assisting the process." fill priority sizes="(min-width: 1280px) 55vw, 100vw" className="object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent px-5 pb-5 pt-20">
                    <p className="max-w-2xl text-xs leading-5 text-white/90"><strong>AI supports the practice—it does not run it.</strong> The people, their safety, and their choices remain authoritative.</p>
                  </div>
                </figure>
              </div>
              <div className="grid border-t border-white/10 sm:grid-cols-3">
                {[
                  ['Restorative justice', 'Repair harm through voluntary, accountable, community-centered options.', HeartHandshake],
                  ['Victim services', 'Prioritize safety, voice, privacy, advocacy, and continuing choice.', ShieldCheck],
                  ['CommonGround AI', 'Find cited public guidance, test safeguards, and wait for a trained reviewer.', BrainCircuit],
                ].map(([label, description, Icon], index) => (
                  <div key={label as string} className={`flex gap-3 px-5 py-4 ${index ? 'border-t border-white/10 sm:border-l sm:border-t-0' : ''}`}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-teal-200"><Icon className="size-4" /></span>
                    <div><p className="text-xs font-semibold text-white">{label as string}</p><p className="mt-1 text-[11px] leading-4 text-slate-400">{description as string}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Graphs', '2 workflows · 13 nodes', Waypoints],
                  ['Corpus', '10 public sources', Database],
                  ['Evaluation', '48 versioned cases', BarChart3],
                  ['Privacy', 'Metadata-only traces', LockKeyhole],
                ].map(([label, value, Icon]) => (
                  <Card key={label as string} size="sm" className="border border-border/70 bg-card/90"><CardContent className="flex h-full flex-col justify-between gap-3"><Icon className="size-5 text-primary" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label as string}</p><p className="mt-1 text-xs font-semibold">{value as string}</p></div></CardContent></Card>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
              <div className="space-y-4">
                <Card className="border border-border/70 shadow-xl shadow-slate-900/5">
                  <CardHeader className="border-b"><CardTitle>1. Choose a fictional training scenario</CardTitle><CardDescription>Privacy screening runs before any external AI provider receives text.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(Object.keys(scenarios) as ScenarioKey[]).map((key) => {
                        const item = scenarios[key];
                        const Icon = item.icon;
                        return <Button key={key} variant={scenarioKey === key ? 'default' : 'outline'} onClick={() => chooseScenario(key)} className="h-auto justify-start whitespace-normal px-3 py-3 text-left"><Icon className="shrink-0" /><span><span className="block text-[10px] opacity-70">{item.eyebrow}</span><span className="block text-xs font-semibold">{item.label}</span></span></Button>;
                      })}
                    </div>
                    <Textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} aria-label="Fictional case description" className="min-h-44 resize-y bg-muted/20 p-4 leading-6" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold">Evidence jurisdiction
                        <select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value as 'colorado' | 'national')} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                          <option value="colorado">Colorado + national guidance</option>
                          <option value="national">National guidance only</option>
                        </select>
                      </label>
                      <TurnstileGate onToken={handleTurnstile} resetKey={turnstileReset} />
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center"><p className="text-[11px] leading-4 text-muted-foreground"><LockKeyhole className="mr-1 inline size-3" /> No raw narrative is stored in D1 or LangSmith.</p><Button size="lg" onClick={runAnalysis} disabled={running || caseText.trim().length < 20} className="min-w-48">{running ? <RefreshCw className="animate-spin" /> : <Play />}{running ? 'Running guarded graph…' : 'Run live workflow'}</Button></CardFooter>
                </Card>
                {liveError && <Alert className="border-amber-200 bg-amber-50 text-amber-950"><AlertTriangle /><AlertTitle>Workflow stopped safely</AlertTitle><AlertDescription>{liveError}</AlertDescription></Alert>}
              </div>

              <Card className="border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-slate-950/15">
                <CardHeader className="border-b border-white/10"><CardTitle className="text-white">2. Observable LangGraph execution</CardTitle><CardDescription className="text-slate-400">Every stage below corresponds to real backend code and a metadata-only trace span.</CardDescription><CardAction><Badge className="border border-white/15 bg-white/5 font-mono text-slate-200">{liveResult?.traceId || 'ready'}</Badge></CardAction></CardHeader>
                <CardContent>
                  <ol className="grid gap-2 sm:grid-cols-2">
                    {graphSteps.map(({ stage, label, detail, icon: Icon }, index) => {
                      const event = timelineByStage.get(stage);
                      const waiting = event?.status === 'waiting';
                      const completed = event?.status === 'passed';
                      const stopped = event?.status === 'stopped';
                      return (
                        <li key={stage} className={`relative rounded-xl border p-3 transition-all ${completed ? 'border-emerald-400/30 bg-emerald-400/10' : waiting ? 'border-amber-300/40 bg-amber-300/10' : stopped ? 'border-rose-400/40 bg-rose-400/10' : running && index === 0 ? 'border-sky-300/40 bg-sky-300/10' : 'border-white/10 bg-white/[0.035]'}`}>
                          <div className="flex items-start gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-lg ${completed ? 'bg-emerald-400 text-slate-950' : waiting ? 'bg-amber-300 text-slate-950' : 'bg-white/10 text-sky-200'}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">{label}</p><span className="font-mono text-[9px] text-slate-400">0{index + 1}</span></div><p className="mt-1 text-[10px] leading-4 text-slate-400">{event?.detail || detail}</p>{event && <p className="mt-1 font-mono text-[9px] text-slate-500">{event.durationMs} ms</p>}</div></div>
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
                <CardFooter className="border-white/10 bg-white/[0.035]"><p className="text-[11px] leading-5 text-slate-400">The graph can stop at the policy, evidence, citation, or safety gate. Nothing is sent, referred, or written to an agency system.</p></CardFooter>
              </Card>
            </div>

            {liveResult && (
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <Card className={`border shadow-xl shadow-slate-900/5 ${liveResult.abstained ? 'border-amber-300' : 'border-emerald-300'}`}>
                  <CardHeader className={liveResult.abstained ? 'bg-amber-50/70' : 'bg-emerald-50/70'}><div className="mb-2 flex flex-wrap gap-2"><Badge className={liveResult.abstained ? 'bg-amber-700 text-white' : 'bg-emerald-700 text-white'}>{liveResult.abstained ? <ShieldAlert /> : <ShieldCheck />}{liveResult.abstained ? 'Safely withheld' : 'Release gates passed'}</Badge><Badge variant="outline">{liveResult.citations.length} cited sources</Badge><Badge variant="outline">{Math.round(liveResult.groundingScore * 100)}% grounding</Badge></div><CardTitle>3. Cited practice brief</CardTitle><CardDescription>Every displayed source is explicitly selected by a claim—not merely retrieved.</CardDescription></CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Safeguard finding</p><p className="text-sm leading-6">{liveResult.finding.text}</p><SourceLinks ids={liveResult.finding.citation_ids} citations={liveResult.citations} /></div>
                    <div><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Options for trained review</p><ol className="space-y-2">{liveResult.options.map((option, index) => <li key={`${option.text}-${index}`} className="rounded-xl border border-border bg-muted/20 p-3"><div className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span><p className="text-sm leading-5">{option.text}</p></div><div className="ml-9"><SourceLinks ids={option.citation_ids} citations={liveResult.citations} /></div></li>)}</ol></div>
                    <div className="grid gap-2 sm:grid-cols-2">{liveResult.safeguards.map((item) => <div key={item.text} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-950"><span className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" />{item.text}</span><SourceLinks ids={item.citation_ids} citations={liveResult.citations} /></div>)}</div>
                  </CardContent>
                </Card>

                <Card className="border border-border/70">
                  <CardHeader><CardTitle>4. Human approval checkpoint</CardTitle><CardDescription>The decision is persisted as metadata. The fictional narrative and brief are not stored.</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    {approvalStatus === 'pending' && liveResult.awaitingApproval ? <>
                      <label className="block text-xs font-semibold">Reviewer role<select value={reviewerRole} onChange={(event) => setReviewerRole(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="volunteer">RJ volunteer</option><option value="facilitator">Facilitator</option><option value="victim_advocate">Victim advocate</option><option value="supervisor">Supervisor</option><option value="instructor">Instructor</option></select></label>
                      <label className="block text-xs font-semibold">Review comment<textarea value={approvalComment} onChange={(event) => setApprovalComment(event.target.value)} maxLength={500} className="mt-1 min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm" placeholder="Optional training feedback; do not enter case information." /></label>
                      <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" disabled={savingApproval} onClick={() => submitApproval('revision_requested')}>Request revision</Button><Button disabled={savingApproval} onClick={() => submitApproval('approved')}><UserCheck /> Approve training brief</Button></div>
                    </> : <div className={`rounded-xl border p-4 ${approvalStatus === 'approved' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><p className="flex items-center gap-2 text-sm font-semibold">{approvalStatus === 'approved' ? <CheckCircle2 className="text-emerald-700" /> : <AlertTriangle className="text-amber-700" />}{approvalStatus === 'approved' ? 'Training brief approved' : liveResult.abstained ? 'No approval required for withheld output' : 'Revision requested'}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">No external action was taken. Trace {liveResult.traceId.slice(0, 18)}…</p></div>}
                  </CardContent>
                  <CardFooter className="justify-between"><span className="font-mono text-[10px] text-muted-foreground">{liveResult.promptVersion} · {liveResult.corpusVersion}</span><span className="text-[10px] text-muted-foreground">{(liveResult.latencyMs / 1000).toFixed(2)} s</span></CardFooter>
                </Card>
              </div>
            )}
          </section>
        )}

        {activeView === 'practice' && <PracticeLab />}

        {activeView === 'evidence' && (
          <section aria-label="Evidence explorer"><SectionHeading eyebrow="Retrieval engineering" title="Inspect the exact evidence behind each claim." description="The live pipeline combines Pinecone semantic retrieval with local BM25, fuses both rankings, applies jurisdiction metadata filters, and reranks the strongest passages before generation." />
            {!liveResult?.citations.length ? <Alert><Search /><AlertTitle>Run a live workflow first</AlertTitle><AlertDescription>The Evidence view displays only the sources and real scores selected by the current analysis. The Public sources tab contains the complete approved library.</AlertDescription></Alert> : <div className="grid gap-4 xl:grid-cols-2">{liveResult.citations.map((citation, index) => <Card key={citation.id} className="border border-border/70"><CardHeader><div className="mb-2 flex flex-wrap gap-2"><Badge>Rank {index + 1}</Badge><Badge variant="outline">{citation.jurisdiction}</Badge><Badge variant="outline">{citation.topic}</Badge></div><CardTitle>{citation.title}</CardTitle><CardDescription>{citation.section}</CardDescription></CardHeader><CardContent><p className="border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">{citation.snippet}</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Dense', citation.denseScore], ['BM25', citation.keywordScore], ['RRF', citation.fusionScore], ['Rerank', citation.rerankScore]].map(([label, value]) => <div key={label as string} className="rounded-lg bg-muted/40 p-2"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label as string}</span><Score value={value as number} /></div><Progress value={Math.min(100, (value as number) * (label === 'RRF' ? 2000 : 100))} /></div>)}</div></CardContent><CardFooter className="justify-between"><span className="font-mono text-[10px] text-muted-foreground">{citation.id}</span><a href={citation.url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">Open public source <ExternalLink /></Button></a></CardFooter></Card>)}</div>}
          </section>
        )}

        {activeView === 'evals' && (
          <section aria-label="Evaluation lab"><SectionHeading eyebrow="Versioned evaluation" title="Measured safeguards—not decorative percentages." description="The repository includes 48 executable synthetic cases, including counterfactual fairness pairs and prompt attacks. Deterministic preflight checks run locally; live mode exercises the provider-backed workflow while production traces and evaluator feedback are recorded in LangSmith." />
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{evalReport?.categories.map((category) => <Card key={category.label} size="sm"><CardContent><p className="font-mono text-3xl font-semibold">{category.count}</p><p className="mt-1 text-xs text-muted-foreground">{category.label}</p></CardContent></Card>)}</div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <Card><CardHeader><CardTitle>Latest executable report</CardTitle><CardDescription>{evalReport?.dataset || 'Loading evaluation report'} · {evalReport?.mode || '—'} mode</CardDescription><CardAction><Badge className={evalReport?.passed === evalReport?.total ? 'bg-emerald-700 text-white' : 'bg-amber-700 text-white'}>{evalReport ? `${evalReport.passed}/${evalReport.total} passed` : 'Loading'}</Badge></CardAction></CardHeader><CardContent className="space-y-3">{evalReport && Object.entries(evalReport.metrics).map(([key, value]) => <div key={key}><div className="mb-1.5 flex items-center justify-between"><span className="text-xs font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}</span><span className="font-mono text-xs font-semibold">{value === null ? 'Run live experiment' : `${value}%`}</span></div><Progress value={value || 0} /></div>)}<p className="rounded-xl bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">{evalReport?.note}</p></CardContent></Card>
              <Card><CardHeader><CardTitle>Release gates</CardTitle><CardDescription>Changes should not ship when a critical threshold regresses.</CardDescription></CardHeader><CardContent className="space-y-2">{evalReport && Object.entries(evalReport.releaseThresholds).map(([key, value]) => <div key={key} className="flex items-center justify-between rounded-xl border p-3"><span className="flex items-center gap-2 text-xs font-medium"><ShieldCheck className="size-4 text-emerald-700" />{key.replace(/([A-Z])/g, ' $1')}</span><Badge variant="outline">≥ {value}%</Badge></div>)}<div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-900"><strong>Dataset provenance:</strong> synthetic, de-identified, version controlled, and safe to inspect in the public repository.</div></CardContent></Card>
            </div>
          </section>
        )}

        {activeView === 'trace' && (
          <section aria-label="Production trace"><SectionHeading eyebrow="LangSmith observability" title="Actual stage timings with metadata-only telemetry." description="Every provider or policy stage creates a child span. Raw narratives, generated brief text, and retrieved excerpts are deliberately excluded from LangSmith." />
            {!liveResult ? <Alert><Activity /><AlertTitle>No trace in this browser session yet</AlertTitle><AlertDescription>Run a live workflow to populate the real timeline, token counts, latency, grounding score, and release-gate results.</AlertDescription></Alert> : <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"><Card><CardHeader><CardTitle>Trace timeline</CardTitle><CardDescription className="font-mono">{liveResult.traceId}</CardDescription></CardHeader><CardContent><ol className="ml-3 border-l border-border pl-6">{liveResult.timeline.map((event, index) => <li key={`${event.stage}-${index}`} className="relative pb-6 last:pb-0"><span className={`absolute -left-[2.15rem] grid size-7 place-items-center rounded-full border ${event.status === 'passed' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : event.status === 'waiting' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-rose-300 bg-rose-50 text-rose-700'}`}>{event.status === 'passed' ? <Check className="size-3.5" /> : event.status === 'waiting' ? <UserCheck className="size-3.5" /> : <AlertTriangle className="size-3.5" />}</span><div className="flex flex-col justify-between gap-1 sm:flex-row"><div><p className="text-sm font-semibold">{event.label}</p><p className="mt-1 text-xs text-muted-foreground">{event.detail}</p></div><Badge variant="outline" className="font-mono">{event.durationMs} ms</Badge></div></li>)}</ol></CardContent></Card><div className="space-y-4"><Card><CardHeader><CardTitle>Run signals</CardTitle></CardHeader><CardContent className="space-y-2">{[['Total latency', `${(liveResult.latencyMs / 1000).toFixed(2)} s`, Clock3], ['Model tokens', String((liveResult.usage.generationTokens || 0) + (liveResult.usage.criticTokens || 0)), Bot], ['Cited evidence', String(liveResult.citations.length), BookOpenCheck], ['Grounding', `${Math.round(liveResult.groundingScore * 100)}%`, ShieldCheck], ['Raw text logged', 'No', LockKeyhole]].map(([label, value, Icon]) => <div key={label as string} className="flex items-center justify-between rounded-xl border p-3"><span className="flex items-center gap-2 text-xs"><Icon className="size-4 text-primary" />{label as string}</span><span className="font-mono text-xs font-semibold">{value as string}</span></div>)}</CardContent></Card><Alert className="border-emerald-200 bg-emerald-50 text-emerald-950"><ShieldCheck /><AlertTitle>Privacy-minimized by design</AlertTitle><AlertDescription>LangSmith receives counts, scores, versions, durations, and status only.</AlertDescription></Alert></div></div>}
          </section>
        )}

        {activeView === 'monitor' && <PolicyMonitor />}

        {activeView === 'map' && <KnowledgeMap />}

        {activeView === 'sources' && (
          <section aria-label="Approved public sources"><SectionHeading eyebrow="Public evidence library" title="Open every approved source for more information." description="The RAG corpus contains attributed summaries for retrieval. The links below lead to the original public materials; always review the authoritative source and current local policy." />
            <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{knowledge.map((source) => <Card key={source.id} className="border border-border/70"><CardHeader><div className="mb-2 flex gap-2"><Badge variant="outline">{source.jurisdiction}</Badge><Badge variant="secondary">{source.topic}</Badge></div><CardTitle>{source.title}</CardTitle><CardDescription>{source.section}</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{source.text}</p></CardContent><CardFooter className="justify-between"><span className="font-mono text-[9px] text-muted-foreground">Curated summary · {source.id}</span><a href={source.url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">More information <ExternalLink /></Button></a></CardFooter></Card>)}</div>
            <Card className="border border-sky-200 bg-sky-50/60"><CardHeader><CardTitle>Check for newer public guidance</CardTitle><CardDescription>You.com searches eight allowlisted government and victim-service domains. Results remain advisory until a curator reviews and approves them.</CardDescription></CardHeader><CardContent className="grid gap-4 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1.35fr)]"><div className="space-y-3"><TurnstileGate onToken={handleTurnstile} resetKey={turnstileReset} /><Button variant="outline" onClick={runFreshnessResearch} disabled={researching} className="w-full">{researching ? <RefreshCw className="animate-spin" /> : <Globe2 />}{researching ? 'Searching approved domains…' : 'Search current public guidance'}</Button>{researchError && <p className="text-xs text-amber-800">{researchError}</p>}</div><div className="grid gap-2 md:grid-cols-2">{researchResults.length ? researchResults.map((result) => <a key={result.url} href={result.url} target="_blank" rel="noreferrer" className="rounded-xl border border-sky-200 bg-white p-3 hover:border-sky-400"><span className="flex items-start justify-between gap-2 text-xs font-semibold">{result.title}<ExternalLink className="size-3.5 shrink-0" /></span><span className="mt-1 line-clamp-3 block text-[11px] leading-4 text-muted-foreground">{result.description}</span></a>) : <div className="col-span-full grid min-h-28 place-items-center rounded-xl border border-dashed border-sky-200 bg-white/60 text-xs text-muted-foreground">No curator-candidate results in this session.</div>}</div></CardContent></Card>
          </section>
        )}

        {activeView === 'architecture' && (
          <section aria-label="Technical architecture"><SectionHeading eyebrow="Technical architecture" title="A production-minded AI system, not a chatbot wrapper." description="Each layer is independently testable and replaceable. The browser never receives Fireworks, Pinecone, You.com, LangSmith, or Turnstile secret keys." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">{[
              { title: 'Experience', icon: MessageSquareText, items: ['React 19 + TypeScript', 'Tailwind + shadcn', 'Accessible working surface'], tone: 'border-sky-200 bg-sky-50' },
              { title: 'Orchestration', icon: GitBranch, items: ['Two LangGraph workflows', 'Five specialized agents', 'Human checkpoint + D1 record'], tone: 'border-violet-200 bg-violet-50' },
              { title: 'Retrieval', icon: Database, items: ['Pinecone dense search', 'BM25 lexical ranking', 'RRF + Fireworks rerank'], tone: 'border-emerald-200 bg-emerald-50' },
              { title: 'Models', icon: BrainCircuit, items: ['Role-based model routing', 'Schema-constrained agents', 'Independent safety critic'], tone: 'border-amber-200 bg-amber-50' },
              { title: 'Intelligence', icon: Globe2, items: ['You.com allowlist search', 'AI change triage', 'Corpus relationship map'], tone: 'border-cyan-200 bg-cyan-50' },
              { title: 'Assurance', icon: ShieldCheck, items: ['48-case eval dataset', 'Fairness + attack tests', 'LangSmith child spans'], tone: 'border-rose-200 bg-rose-50' },
            ].map(({ title, icon: Icon, items, tone }) => <div key={title} className="flex flex-col gap-3"><Card className={`h-full border ${tone}`}><CardHeader><span className="mb-2 grid size-10 place-items-center rounded-xl bg-white/80"><Icon className="size-5" /></span><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-2">{items.map((item) => <p key={item} className="flex items-start gap-2 text-xs leading-5"><Check className="mt-1 size-3 shrink-0" />{item}</p>)}</CardContent></Card></div>)}</div>
            <div className="mt-6 grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>Fail-closed controls</CardTitle></CardHeader><CardContent className="space-y-2 text-xs leading-5 text-muted-foreground"><p><ChevronRight className="mr-1 inline size-3 text-primary" />Privacy and prohibited-decision rules run before AI calls.</p><p><ChevronRight className="mr-1 inline size-3 text-primary" />Low evidence, invalid citations, or safety failure withholds output.</p><p><ChevronRight className="mr-1 inline size-3 text-primary" />Provider calls have timeouts and one bounded transient retry.</p></CardContent></Card><Card><CardHeader><CardTitle>Operational boundaries</CardTitle></CardHeader><CardContent className="space-y-2 text-xs leading-5 text-muted-foreground"><p><ChevronRight className="mr-1 inline size-3 text-primary" />No eligibility, guilt, credibility, remorse, diagnosis, or risk decisions.</p><p><ChevronRight className="mr-1 inline size-3 text-primary" />No automatic message, referral, or case-system update.</p><p><ChevronRight className="mr-1 inline size-3 text-primary" />Agency use requires local governance and security review.</p></CardContent></Card><Card><CardHeader><CardTitle>Deployment</CardTitle></CardHeader><CardContent className="space-y-2 text-xs leading-5 text-muted-foreground"><p><Zap className="mr-1 inline size-3 text-primary" />OpenAI Sites and Cloudflare Workers.</p><p><Database className="mr-1 inline size-3 text-primary" />D1 stores only rate and approval metadata.</p><p><Code2 className="mr-1 inline size-3 text-primary" />Public source, versioned prompts, corpus, migrations, and evals.</p></CardContent></Card></div>
          </section>
        )}
      </div>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-300"><div className="mx-auto flex max-w-[1580px] flex-col justify-between gap-4 px-4 py-6 text-xs sm:flex-row sm:px-6 lg:px-8"><div><p className="font-semibold text-white">CommonGround AI</p><p className="mt-1 text-slate-400">Human judgment, victim choice, and approved policy remain authoritative.</p></div><div className="flex flex-wrap gap-4"><button onClick={() => setActiveView('sources')} className="hover:text-white">Public sources</button><button onClick={() => setActiveView('evals')} className="hover:text-white">Evaluation evidence</button><a href="https://github.com/sivalinb/commonground-ai" target="_blank" rel="noreferrer" className="hover:text-white">GitHub repository</a></div></div></footer>
    </main>
  );
}
