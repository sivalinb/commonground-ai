import type { Metadata } from 'next';
import { TrustCard, TrustShell } from '@/components/trust-shell';

export const metadata: Metadata = {
  title: 'Security | CommonGround AI',
  description: 'Security controls and deployment boundary for CommonGround AI.',
};

export default function SecurityPage() {
  return (
    <TrustShell
      eyebrow="Security"
      title="Defense in depth for a public training environment."
      description="The application fails closed at the API boundary, isolates credentials on the server, constrains model behavior, and records control events without storing case narratives."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <TrustCard title="Application controls">
          <ul className="list-disc space-y-2 pl-5">
            <li>Same-origin and content-type enforcement</li>
            <li>Strict Zod request and provider-output schemas</li>
            <li>Distributed D1 rate limiting and Turnstile challenges</li>
            <li>Short-lived approval tokens bound to one workflow</li>
            <li>Provider timeouts, bounded retries, and safe failures</li>
            <li>Allowlisted HTTPS domains for freshness research</li>
          </ul>
        </TrustCard>
        <TrustCard title="AI-specific controls">
          <ul className="list-disc space-y-2 pl-5">
            <li>Prompt-injection and prohibited-decision screening</li>
            <li>Weak-evidence abstention</li>
            <li>Claim-to-source citation validation</li>
            <li>Independent cross-provider safety review</li>
            <li>No tools capable of agency or participant action</li>
            <li>Versioned prompts, corpus, traces, and eval datasets</li>
          </ul>
        </TrustCard>
      </div>
      <TrustCard title="Agency deployment gate" tone="amber">
        <p>
          This demo is not represented as CJIS compliant or suitable for
          criminal justice information. If an agency proposes such use, its
          CJIS security officer, privacy counsel, records owner, victim-services
          leadership, and technology security team must approve the architecture,
          vendor terms, identity controls, data flows, retention, incident
          response, and testing.
        </p>
        <a className="mt-3 inline-block font-semibold text-primary underline" href="https://www.fbi.gov/services/cjis" target="_blank" rel="noreferrer">FBI CJIS Security Policy Resource Center</a>
      </TrustCard>
      <TrustCard title="Next independent assurances">
        <p>
          A controlled pilot should add agency SSO and RBAC, a documented threat
          model, dependency and dynamic scanning, an SBOM, penetration testing,
          backup restoration testing, a vendor security review, and a formal
          incident-response exercise.
        </p>
      </TrustCard>
    </TrustShell>
  );
}
