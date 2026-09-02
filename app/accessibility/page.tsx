import type { Metadata } from 'next';
import { TrustCard, TrustShell } from '@/components/trust-shell';

export const metadata: Metadata = {
  title: 'Accessibility | CommonGround AI',
  description: 'Accessibility commitments and current status for CommonGround AI.',
};

export default function AccessibilityPage() {
  return (
    <TrustShell
      eyebrow="Accessibility"
      title="Equal access is a product requirement."
      description="The interface is designed around semantic landmarks, keyboard operation, visible focus, readable contrast, responsive layouts, reduced motion, text alternatives, and typed alternatives to voice."
    >
      <TrustCard title="Implemented in this demonstration" tone="green">
        <ul className="list-disc space-y-2 pl-5">
          <li>Skip navigation and semantic page landmarks</li>
          <li>Keyboard-operable controls and visible focus indicators</li>
          <li>Descriptive labels, status text, and image alternative text</li>
          <li>Responsive reflow without required horizontal navigation</li>
          <li>Reduced-motion behavior through system preferences</li>
          <li>Typed input remains available when voice is unavailable</li>
        </ul>
      </TrustCard>
      <TrustCard title="Conformance status" tone="amber">
        <p>
          WCAG 2.2 AA is the target, but CommonGround does not claim formal
          conformance until an independent audit with keyboard, screen-reader,
          contrast, zoom/reflow, cognitive-accessibility, and generated-content
          testing is completed. Spanish content also requires professional and
          community review.
        </p>
      </TrustCard>
      <div className="flex flex-wrap gap-4 text-sm">
        <a className="font-semibold text-primary underline" href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noreferrer">W3C WCAG 2.2</a>
        <a className="font-semibold text-primary underline" href="https://leg.colorado.gov/sites/default/files/2021a_1110_signed.pdf" target="_blank" rel="noreferrer">Colorado HB21-1110</a>
      </div>
    </TrustShell>
  );
}
