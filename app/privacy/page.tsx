import type { Metadata } from 'next';
import { TrustCard, TrustShell } from '@/components/trust-shell';

export const metadata: Metadata = {
  title: 'Privacy | CommonGround AI',
  description: 'Data handling and privacy boundaries for CommonGround AI.',
};

export default function PrivacyPage() {
  return (
    <TrustShell
      eyebrow="Privacy"
      title="Data minimization starts before the first model call."
      description="CommonGround is designed for fictional and properly de-identified training input. Its public deployment blocks common identifiers and keeps raw narratives out of durable application storage and observability traces."
    >
      <TrustCard title="Data-flow summary">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead><tr className="border-b"><th className="py-2 pr-4">Data</th><th className="py-2 pr-4">Purpose</th><th className="py-2 pr-4">Application storage</th><th className="py-2">Boundary</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-3 pr-4 font-semibold">Training prompt</td><td className="py-3 pr-4">Generate practice guidance</td><td className="py-3 pr-4">Not stored in D1 or LangSmith</td><td className="py-3">Fictional/de-identified only</td></tr>
              <tr><td className="py-3 pr-4 font-semibold">Voice recording</td><td className="py-3 pr-4">Deepgram transcription</td><td className="py-3 pr-4">Not stored by CommonGround</td><td className="py-3">Training voice only</td></tr>
              <tr><td className="py-3 pr-4 font-semibold">Workflow metadata</td><td className="py-3 pr-4">Quality and audit evidence</td><td className="py-3 pr-4">D1 and metadata-only LangSmith</td><td className="py-3">Counts, versions, scores, status</td></tr>
              <tr><td className="py-3 pr-4 font-semibold">Public evidence</td><td className="py-3 pr-4">Grounding and citations</td><td className="py-3 pr-4">Approved Pinecone namespace and Neo4j graph</td><td className="py-3">Public sources only</td></tr>
            </tbody>
          </table>
        </div>
      </TrustCard>
      <TrustCard title="Privacy firewall">
        <p>
          The API rejects email addresses, phone numbers, street addresses,
          report numbers, dates of birth, Social Security numbers, license
          plates, student identifiers, labeled person names, medical/client
          identifiers, and driver-license numbers before provider processing.
          Pattern screening reduces risk but cannot guarantee de-identification;
          the user attestation and organizational policy remain mandatory.
        </p>
      </TrustCard>
      <TrustCard title="Real-data requirements" tone="amber">
        <p>
          Real-data use remains disabled by policy. It requires agency-approved
          data classification, retention/deletion, legal hold, consent,
          confidentiality, breach response, provider retention/no-training
          review, data-residency review, and signed contractual terms.
        </p>
      </TrustCard>
    </TrustShell>
  );
}
