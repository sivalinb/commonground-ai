import type { Metadata } from 'next';
import { SystemStatus } from '@/components/system-status';
import { TrustCard, TrustShell } from '@/components/trust-shell';

export const metadata: Metadata = {
  title: 'System Status | CommonGround AI',
  description: 'Live configuration status and operational boundaries for CommonGround AI.',
};

export default function StatusPage() {
  return (
    <TrustShell
      eyebrow="System status"
      title="Visible configuration. Honest boundaries."
      description="This page reports whether the public training environment has its protected integrations configured. It is not a substitute for provider uptime monitoring, an SLA, or agency production authorization."
    >
      <SystemStatus />
      <TrustCard title="Safe failure behavior">
        <p>
          Provider failures return a bounded error and take no external action.
          Missing evidence causes abstention. Safety disagreement withholds the
          draft. Approval sessions expire and cannot be replayed against another
          workflow. Infrastructure monitoring and a formal on-call process are
          still required for an agency pilot.
        </p>
      </TrustCard>
    </TrustShell>
  );
}
