'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  Check,
  CirclePause,
  Headphones,
  HeartHandshake,
  Mic,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Square,
  UserRound,
  Volume2,
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
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

type PracticeResult = {
  traceId: string;
  participant: {
    reply: string;
    perspective_note: string;
    consent_signal: 'open' | 'uncertain' | 'pause';
  };
  coach: {
    strengths: string[];
    improvements: string[];
    suggested_question: string;
    skill_labels: string[];
    evidence_ids: string[];
  };
  advocate: {
    approved: boolean;
    pause_recommended: boolean;
    autonomy_score: number;
    trauma_aware_score: number;
    concerns: string[];
    safer_alternative: string;
  };
  evaluator: {
    autonomy_score: number;
    trauma_aware_score: number;
    open_question_score: number;
    reflection_score: number;
    evidence_use_score: number;
    summary: string;
    next_practice_goal: string;
  };
  scorecard: {
    autonomy: number;
    traumaAware: number;
    openQuestions: number;
    reflection: number;
    evidenceUse: number;
    overall: number;
  };
  evidence: Array<{
    id: string;
    title: string;
    url: string;
    snippet: string;
    rerankScore: number;
  }>;
  timeline: Array<{
    stage: string;
    label: string;
    status: string;
    durationMs: number;
    detail: string;
  }>;
  modelRoles: Array<{ role: string; model: string }>;
  latencyMs: number;
  promptVersion: string;
};

const practiceScenarios = {
  autonomy: {
    label: 'Choice without direct contact',
    scenario:
      'A fictional community member affected by property damage wants answers and accountability but does not want direct contact. They are willing to hear about indirect options only if they can stop at any time.',
    starter:
      'Thank you for telling me what you do not want. What information or support would help you feel most in control of the next step?',
  },
  youth: {
    label: 'Youth digital harm',
    scenario:
      'A fictional high-school student has experienced peer blame after a private image was shared without permission. They are uncertain about any group conversation and want to understand safety and privacy first.',
    starter:
      'Before discussing any process, what would help you feel safer and what would you like adults involved to understand?',
  },
  pause: {
    label: 'Participant asks to pause',
    scenario:
      'During a fictional preparation conversation, a participant becomes quiet and says they may not want to continue today. The practitioner needs to respond without pressure or assumptions.',
    starter:
      'We can pause here. Would you prefer quiet time, support from someone you trust, or to end the conversation for today?',
  },
};

type ScenarioKey = keyof typeof practiceScenarios;

export function PracticeLab() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('autonomy');
  const [scenario, setScenario] = useState(practiceScenarios.autonomy.scenario);
  const [learnerResponse, setLearnerResponse] = useState(
    practiceScenarios.autonomy.starter,
  );
  const [role, setRole] = useState<
    'volunteer' | 'facilitator' | 'victim_advocate'
  >('volunteer');
  const [language, setLanguage] = useState<'english' | 'spanish'>('english');
  const [running, setRunning] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [transcribeToken, setTranscribeToken] = useState('');
  const [transcribeReset, setTranscribeReset] = useState(0);
  const [speakToken, setSpeakToken] = useState('');
  const [speakReset, setSpeakReset] = useState(0);
  const [trainingUseAcknowledged, setTrainingUseAcknowledged] =
    useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTurnstile = useCallback(
    (token: string) => setTurnstileToken(token),
    [],
  );
  const handleTranscribeTurnstile = useCallback(
    (token: string) => setTranscribeToken(token),
    [],
  );
  const handleSpeakTurnstile = useCallback(
    (token: string) => setSpeakToken(token),
    [],
  );

  const scoreRows = useMemo(
    () =>
      result
        ? [
            ['Autonomy', result.scorecard.autonomy],
            ['Trauma-aware', result.scorecard.traumaAware],
            ['Open questions', result.scorecard.openQuestions],
            ['Reflection', result.scorecard.reflection],
            ['Evidence use', result.scorecard.evidenceUse],
          ]
        : [],
    [result],
  );

  function chooseScenario(key: ScenarioKey) {
    setScenarioKey(key);
    setScenario(practiceScenarios[key].scenario);
    setLearnerResponse(practiceScenarios[key].starter);
    setResult(null);
    setError('');
  }

  async function transcribeRecording(recording: Blob) {
    setTranscribing(true);
    setError('');
    try {
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': recording.type || 'audio/webm',
          'X-Turnstile-Token': transcribeToken,
          'X-Practice-Language': language,
          'X-Training-Use-Acknowledged': String(trainingUseAcknowledged),
        },
        body: recording,
      });
      const body = (await response.json()) as {
        transcript?: string;
        confidence?: number | null;
        error?: string;
      };
      if (!response.ok || !body.transcript)
        throw new Error(body.error || 'No speech was detected.');
      setLearnerResponse(body.transcript);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Voice transcription stopped safely.',
      );
    } finally {
      setTranscribing(false);
      setTranscribeToken('');
      setTranscribeReset((value) => value + 1);
    }
  }

  async function dictate() {
    if (listening) {
      recorderRef.current?.stop();
      return;
    }
    if (!transcribeToken) {
      setError('Complete the voice verification before recording.');
      return;
    }
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setError(
        'Audio recording is not supported in this browser. The typed practice lab remains available.',
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferred = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : '';
      const recorder = preferred
        ? new MediaRecorder(stream, { mimeType: preferred })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setListening(false);
        void transcribeRecording(
          new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          }),
        );
      };
      recorder.start();
      setListening(true);
      stopTimerRef.current = setTimeout(
        () => recorder.state === 'recording' && recorder.stop(),
        45_000,
      );
    } catch {
      setListening(false);
      setError(
        'Microphone access was not available. You can continue by typing.',
      );
    }
  }

  async function speak() {
    if (!result) return;
    if (!speakToken) {
      setError('Complete the read-aloud verification first.');
      return;
    }
    setSpeaking(true);
    setError('');
    try {
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: result.participant.reply,
          language,
          trainingUseAcknowledged,
          turnstileToken: speakToken,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || 'AI read-aloud failed.');
      }
      const audioUrl = URL.createObjectURL(await response.blob());
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      audio.onerror = () => URL.revokeObjectURL(audioUrl);
      await audio.play();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'AI read-aloud failed safely.',
      );
    } finally {
      setSpeaking(false);
      setSpeakToken('');
      setSpeakReset((value) => value + 1);
    }
  }

  async function runPractice() {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          learnerResponse,
          role,
          jurisdiction: 'colorado',
          language,
          trainingUseAcknowledged,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const body = (await response.json()) as PracticeResult & {
        error?: string;
      };
      if (!response.ok)
        throw new Error(body.error || 'The practice lab stopped safely.');
      setResult(body);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The practice lab stopped safely.',
      );
    } finally {
      setRunning(false);
      setTurnstileToken('');
      setTurnstileReset((value) => value + 1);
    }
  }

  return (
    <section aria-label="Multi-agent practice lab">
      <div className="relative mb-7 overflow-hidden rounded-[1.75rem] border border-white/70 bg-card/85 p-6 shadow-[0_18px_60px_-36px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
        <div className="absolute -right-10 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="size-3.5" /> Multi-agent simulation
          </p>
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Practice a response. Watch five AI roles examine it.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
            A fictional participant, evidence retriever, facilitator coach,
            victim-services reviewer, and rubric evaluator collaborate through
            LangGraph. This is communication training—not a simulation of any
            real person.
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-5">
        {[
          ['Evidence agent', BookOpenCheck, 'Pinecone + BM25'],
          ['Participant', UserRound, 'Fictional role-play'],
          ['Coach', HeartHandshake, 'Skill feedback'],
          ['Safety agent', ShieldCheck, 'Autonomy review'],
          ['Evaluator', BrainCircuit, 'Structured rubric'],
        ].map(([label, Icon, detail], index) => (
          <Card
            key={label as string}
            size="sm"
            className="relative overflow-hidden border border-border/70 shadow-[0_12px_36px_-28px_rgba(15,23,42,0.5)] transition-all hover:-translate-y-0.5 hover:border-primary/30"
          >
            <CardContent className="space-y-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold">
                  {index + 1}. {label as string}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {detail as string}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <Card className="border border-border/70 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.55)]">
          <CardHeader>
            <CardTitle>Your practice turn</CardTitle>
            <CardDescription>
              Select a safe fictional exercise or edit it without adding
              identifying details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(practiceScenarios) as ScenarioKey[]).map((key) => (
                <Button
                  key={key}
                  variant={scenarioKey === key ? 'default' : 'outline'}
                  className="h-auto rounded-xl whitespace-normal py-3 text-left text-xs"
                  onClick={() => chooseScenario(key)}
                >
                  {practiceScenarios[key].label}
                </Button>
              ))}
            </div>
            <label
              htmlFor="practice-scenario"
              className="block text-xs font-semibold"
            >
              Fictional scenario
              <Textarea
                id="practice-scenario"
                value={scenario}
                onChange={(event) => setScenario(event.target.value)}
                className="mt-1 min-h-28 bg-muted/20 leading-5"
              />
            </label>
            <label
              htmlFor="learner-response"
              className="block text-xs font-semibold"
            >
              What would you say?
              <Textarea
                id="learner-response"
                value={learnerResponse}
                onChange={(event) => setLearnerResponse(event.target.value)}
                className="mt-1 min-h-32 bg-muted/20 leading-5"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label htmlFor="practice-role" className="text-xs font-semibold">
                Practice role
                <select
                  id="practice-role"
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as typeof role)
                  }
                  className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="volunteer">RJ volunteer</option>
                  <option value="facilitator">Facilitator</option>
                  <option value="victim_advocate">Victim advocate</option>
                </select>
              </label>
              <label
                htmlFor="practice-language"
                className="text-xs font-semibold"
              >
                AI response language
                <select
                  id="practice-language"
                  value={language}
                  onChange={(event) =>
                    setLanguage(event.target.value as typeof language)
                  }
                  className="mt-1 block h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="english">English</option>
                  <option value="spanish">Spanish</option>
                </select>
              </label>
            </div>
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
                I confirm both fields and any recording are fictional or
                properly de-identified training content. I will not include
                names, case numbers, contact details, or confidential records.
              </span>
            </label>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-sky-950">
                    Deepgram Nova-3 voice input
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-sky-900/70">
                    For fictional practice only. Audio is sent to Deepgram for
                    transcription and is not stored by CommonGround AI.
                  </p>
                </div>
                <Badge className="bg-sky-700 text-white">AI voice</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                <Button
                  variant="outline"
                  onClick={dictate}
                  disabled={transcribing || !trainingUseAcknowledged}
                >
                  {listening ? <Square /> : <Mic />}
                  {transcribing
                    ? 'Transcribing…'
                    : listening
                      ? 'Stop recording'
                      : 'Record response'}
                </Button>
                <TurnstileGate
                  onToken={handleTranscribeTurnstile}
                  resetKey={transcribeReset}
                  action="voice_transcribe"
                />
              </div>
            </div>
            <TurnstileGate
              onToken={handleTurnstile}
              resetKey={turnstileReset}
              action="practice_run"
            />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-4 text-muted-foreground">
              <Headphones className="mr-1 inline size-3" /> Deepgram processes
              voice transiently; CommonGround stores only the resulting practice
              score metadata.
            </p>
            <Button
              size="lg"
              onClick={runPractice}
              disabled={
                running ||
                scenario.trim().length < 20 ||
                learnerResponse.trim().length < 10
                || !trainingUseAcknowledged
              }
              className="rounded-full"
            >
              {running ? <RefreshCw className="animate-spin" /> : <Play />}
              {running ? 'Agents are reviewing…' : 'Run multi-agent practice'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border border-slate-800 bg-slate-950 text-white">
          <CardHeader>
            <CardTitle className="text-white">Agent observability</CardTitle>
            <CardDescription className="text-slate-400">
              Each completed role is a real provider-backed stage with a
              metadata-only LangSmith span.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-8 text-center">
                <div>
                  <Bot className="mx-auto size-9 text-teal-300" />
                  <p className="mt-4 text-sm font-semibold">
                    Ready for a fictional practice turn
                  </p>
                  <p className="mt-2 max-w-md text-xs leading-5 text-slate-400">
                    The graph retrieves evidence first, then activates the
                    participant, coach, safety reviewer, and evaluator in
                    sequence.
                  </p>
                </div>
              </div>
            ) : (
              <ol className="space-y-2">
                {result.timeline.map((event, index) => (
                  <li
                    key={`${event.stage}-${index}`}
                    className="flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-400 text-slate-950">
                      <Check className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
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
            )}
          </CardContent>
          {result && (
            <CardFooter className="justify-between border-white/10 text-[10px] text-slate-400">
              <span className="font-mono">{result.traceId.slice(0, 26)}…</span>
              <span>{(result.latencyMs / 1000).toFixed(2)} s</span>
            </CardFooter>
          )}
        </Card>
      </div>

      {error && (
        <Alert className="mt-5 border-amber-200 bg-amber-50 text-amber-950">
          <AlertTriangle />
          <AlertTitle>Practice stopped safely</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="space-y-4">
            <Card className="border border-sky-200 bg-sky-50/60">
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-sky-700 text-white">
                    <UserRound /> Fictional participant
                  </Badge>
                  <Badge variant="outline">
                    Signal: {result.participant.consent_signal}
                  </Badge>
                </div>
                <CardTitle>How the simulation responded</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-7">
                  “{result.participant.reply}”
                </p>
                <p className="mt-3 rounded-xl bg-white/70 p-3 text-xs leading-5 text-muted-foreground">
                  <strong>Training-only perspective note:</strong>{' '}
                  {result.participant.perspective_note}
                </p>
                <div className="mt-3">
                  <TurnstileGate
                    onToken={handleSpeakTurnstile}
                    resetKey={speakReset}
                    action="voice_speak"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={speak}
                  disabled={speaking || !trainingUseAcknowledged}
                >
                  <Volume2 />{' '}
                  {speaking ? 'Generating voice…' : 'Deepgram read aloud'}
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Facilitator coach</CardTitle>
                <CardDescription>
                  Grounded in the retrieved public evidence below.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Strengths
                  </p>
                  {result.coach.strengths.map((item) => (
                    <p key={item} className="mb-2 flex gap-2 text-sm leading-5">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                      {item}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Improve next
                  </p>
                  {result.coach.improvements.map((item) => (
                    <p key={item} className="mb-2 flex gap-2 text-sm leading-5">
                      <Activity className="mt-0.5 size-4 shrink-0 text-amber-700" />
                      {item}
                    </p>
                  ))}
                </div>
                <div className="md:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Suggested next move
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6">
                    {result.coach.suggested_question}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.coach.skill_labels.map((label) => (
                      <Badge key={label} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setLearnerResponse(result.coach.suggested_question);
                      setResult(null);
                    }}
                  >
                    <RefreshCw /> Branch and practice this move
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Evidence used by the coaching agent</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {result.evidence.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border p-3 hover:border-primary"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="text-xs font-semibold">{item.title}</p>
                      <Badge variant="outline" className="font-mono">
                        {item.rerankScore.toFixed(2)}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-3 text-[11px] leading-4 text-muted-foreground">
                      {item.snippet}
                    </p>
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card
              className={
                result.advocate.pause_recommended
                  ? 'border-amber-300'
                  : 'border-emerald-300'
              }
            >
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={
                      result.advocate.approved
                        ? 'bg-emerald-700 text-white'
                        : 'bg-amber-700 text-white'
                    }
                  >
                    {result.advocate.approved ? (
                      <ShieldCheck />
                    ) : (
                      <CirclePause />
                    )}
                    {result.advocate.approved
                      ? 'Safety review passed'
                      : 'Revise before continuing'}
                  </Badge>
                  {result.advocate.pause_recommended && (
                    <Badge variant="outline">Pause recommended</Badge>
                  )}
                </div>
                <CardTitle>Victim-services review</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6">
                  {result.advocate.safer_alternative}
                </p>
                {result.advocate.concerns.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {result.advocate.concerns.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-xs leading-5 text-amber-900"
                      >
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-end justify-between">
                  <div>
                    <CardTitle>Practice scorecard</CardTitle>
                    <CardDescription>
                      Observable communication—not a person-level judgment.
                    </CardDescription>
                  </div>
                  <span className="font-mono text-4xl font-semibold text-primary">
                    {result.scorecard.overall}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {scoreRows.map(([label, value]) => (
                  <div key={label as string}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span>{label as string}</span>
                      <span className="font-mono font-semibold">
                        {value as number}
                      </span>
                    </div>
                    <Progress value={value as number} />
                  </div>
                ))}
                <p className="rounded-xl bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
                  {result.evaluator.summary}
                </p>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs leading-5 text-violet-950">
                  <strong>Next practice goal:</strong>{' '}
                  {result.evaluator.next_practice_goal}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cross-provider model routing</CardTitle>
                <CardDescription>
                  Fireworks handles role-play and scoring; Mistral independently
                  reviews victim-services safety.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.modelRoles.map((item) => (
                  <div
                    key={item.role}
                    className="flex items-center justify-between gap-3 rounded-lg border p-2.5 text-xs"
                  >
                    <span>{item.role}</span>
                    <span className="max-w-52 truncate font-mono text-[10px] text-muted-foreground">
                      {item.model}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
