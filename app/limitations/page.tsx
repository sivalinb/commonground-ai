import type { Metadata } from 'next';
import { TrustCard, TrustShell } from '@/components/trust-shell';

export const metadata: Metadata = {
  title: 'AI Limitations | CommonGround AI',
  description: 'Prohibited uses and human-oversight requirements for CommonGround AI.',
};

export default function LimitationsPage() {
  return (
    <TrustShell
      eyebrow="AI limitations"
      title="The model can draft options. It cannot decide a person’s future."
      description="CommonGround deliberately withholds high-consequence judgments and keeps restorative practice, victim choice, safety planning, and policy interpretation with qualified people."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TrustCard title="Never use CommonGround to">
          <ul className="list-disc space-y-2 pl-5">
            <li>Determine guilt, credibility, remorse, or dangerousness</li>
            <li>Diagnose mental health or recommend medication</li>
            <li>Set risk scores, eligibility, sanctions, or legal outcomes</li>
            <li>Require or pressure participation in restorative practice</li>
            <li>Replace emergency, legal, clinical, or victim advocacy services</li>
            <li>Send referrals, messages, reports, or agency record updates</li>
          </ul>
        </TrustCard>
        <TrustCard title="Required human decisions">
          <ul className="list-disc space-y-2 pl-5">
            <li>Whether the evidence applies to the actual jurisdiction</li>
            <li>Whether contacting someone is safe and appropriate</li>
            <li>Whether a restorative option should be offered</li>
            <li>Whether informed, voluntary consent exists and continues</li>
            <li>Whether the AI brief is approved, revised, rejected, or escalated</li>
            <li>Whether policy or professional consultation is required</li>
          </ul>
        </TrustCard>
      </div>
      <TrustCard title="Known technical limitations" tone="amber">
        <p>
          PII detection may miss unusual identifiers. Retrieval may omit a
          controlling policy. Public guidance may be outdated. Model reviewers
          can agree and still be wrong. Citations show source support, not legal
          correctness. Voice transcription and translation may alter meaning.
          Every result therefore remains a reviewable training artifact.
        </p>
      </TrustCard>
    </TrustShell>
  );
}
