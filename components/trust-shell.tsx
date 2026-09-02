/* oxlint-disable next/no-html-link-for-pages */

import type { ReactNode } from 'react';
import {
  Accessibility,
  AlertTriangle,
  ArrowLeft,
  FileLock2,
  HeartHandshake,
  Scale,
  ShieldCheck,
  Signal,
} from 'lucide-react';

const links = [
  ['/trust', 'Trust center', ShieldCheck],
  ['/security', 'Security', FileLock2],
  ['/privacy', 'Privacy', Scale],
  ['/accessibility', 'Accessibility', Accessibility],
  ['/limitations', 'AI limitations', AlertTriangle],
  ['/status', 'System status', Signal],
] as const;

export function TrustShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <a
        href="#trust-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-xl focus:translate-y-0"
      >
        Skip to main content
      </a>
      <header className="border-b border-white/10 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="flex items-center gap-3 rounded-xl">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-300 text-slate-950">
              <HeartHandshake className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">CommonGround AI</span>
              <span className="block text-[10px] text-slate-400">
                Public training demonstration
              </span>
            </span>
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10"
          >
            <ArrowLeft className="size-3.5" /> Return to demo
          </a>
        </div>
      </header>

      <div className="border-b border-amber-300/25 bg-amber-200 text-amber-950">
        <p className="mx-auto max-w-6xl px-4 py-2 text-center text-[11px] font-semibold sm:px-6">
          Controlled training pilot · No real case data · No automated decisions
          · No external agency actions
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:py-12">
        <nav aria-label="Trust center" className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Product trust
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {links.map(([href, label, Icon]) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                {label}
              </a>
            ))}
          </div>
        </nav>

        <article id="trust-content" className="min-w-0 scroll-mt-8">
          <header className="relative overflow-hidden rounded-[2rem] border border-emerald-200/15 bg-slate-950 p-7 text-white shadow-2xl sm:p-10">
            <div className="absolute -right-16 -top-20 size-72 rounded-full bg-teal-400/15 blur-3xl" />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300">
                {eyebrow}
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                {description}
              </p>
            </div>
          </header>
          <div className="mt-6 space-y-5">{children}</div>
        </article>
      </div>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[11px] sm:flex-row sm:justify-between sm:px-6">
          <span>CommonGround AI · evidence-led, human-reviewed</span>
          <span>Training demonstration · fictional scenarios only</span>
        </div>
      </footer>
    </main>
  );
}

export function TrustCard({
  title,
  children,
  tone = 'default',
}: {
  title: string;
  children: ReactNode;
  tone?: 'default' | 'amber' | 'green';
}) {
  const colors =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50/80'
      : tone === 'green'
        ? 'border-emerald-200 bg-emerald-50/70'
        : 'border-border bg-card';
  return (
    <section className={`rounded-2xl border p-6 shadow-sm ${colors}`}>
      <h2 className="text-lg font-semibold tracking-[-0.02em]">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
