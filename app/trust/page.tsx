import type { Metadata } from 'next';
import { TrustCard, TrustShell } from '@/components/trust-shell';

export const metadata: Metadata = {
  title: 'Trust Center | CommonGround AI',
  description:
    'Security, privacy, accessibility, AI safety, and operational boundaries for the CommonGround AI training demonstration.',
};

export default function TrustPage() {
  return (
    <TrustShell
      eyebrow="Trust center"
      title="Built to demonstrate responsible AI—not to imitate agency authorization."
      description="This center makes the system boundary visible: what the public training demo protects today, what it deliberately cannot do, and what an agency must approve before any real-data pilot."
    >
      <TrustCard title="Current deployment" tone="green">
        <p>
          CommonGround is a public, synthetic-data training demonstration. It
          uses protected model APIs, governed public evidence, independent
          safety review, durable human checkpoints, and metadata-only
          observability. It does not connect to dispatch, records-management,
          court, school, or victim-services case systems.
        </p>
      </TrustCard>
      <div className="grid gap-5 md:grid-cols-2">
        <TrustCard title="Controls active now">
          <ul className="list-disc space-y-2 pl-5">
            <li>Explicit training-only attestation at every generative input</li>
            <li>PII pattern blocking before external provider calls</li>
            <li>Allowlisted sources and claim-level citations</li>
            <li>Fireworks and Mistral safety release gates</li>
            <li>Approve, revise, reject, and escalate review decisions</li>
            <li>Privacy-minimized D1 checkpoints and LangSmith traces</li>
          </ul>
        </TrustCard>
        <TrustCard title="Not represented as complete" tone="amber">
          <ul className="list-disc space-y-2 pl-5">
            <li>Agency SSO, RBAC, and multi-tenant authorization</li>
            <li>CJIS, legal, procurement, or records certification</li>
            <li>Approval for real victim, youth, health, or criminal data</li>
            <li>Integration with operational agency systems</li>
            <li>Independent penetration or formal accessibility audit</li>
          </ul>
        </TrustCard>
      </div>
      <TrustCard title="Responsible deployment framework">
        <p>
          The project uses the NIST AI Risk Management Framework’s lifecycle
          approach—govern, map, measure, and manage—as its organizing model.
          Security testing should also cover the current OWASP risks for
          generative-AI applications.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="font-semibold text-primary underline" href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noreferrer">NIST AI RMF</a>
          <a className="font-semibold text-primary underline" href="https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf" target="_blank" rel="noreferrer">NIST Generative AI Profile</a>
          <a className="font-semibold text-primary underline" href="https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/" target="_blank" rel="noreferrer">OWASP GenAI LLM Top 10</a>
        </div>
      </TrustCard>
    </TrustShell>
  );
}
