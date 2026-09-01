'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, ShieldCheck } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let configPromise: Promise<{ turnstileSiteKey?: string }> | null = null;

function publicConfig() {
  configPromise ||= fetch('/api/config').then(
    (response) => response.json() as Promise<{ turnstileSiteKey?: string }>,
  );
  return configPromise;
}

export function TurnstileGate({
  onToken,
  resetKey,
  action = 'commonground_analysis',
}: {
  onToken: (token: string) => void;
  resetKey: number;
  action?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const [siteKey, setSiteKey] = useState<string | undefined>();
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    void publicConfig()
      .then((config) => {
        if (active) setSiteKey(config.turnstileSiteKey);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setConfigLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetRef.current) window.turnstile.remove(widgetRef.current);
      widgetRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        size: 'flexible',
        action,
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };
    if (window.turnstile) render();
    else {
      let script = document.querySelector<HTMLScriptElement>(
        '#commonground-turnstile',
      );
      if (!script) {
        script = document.createElement('script');
        script.id = 'commonground-turnstile';
        script.src =
          'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', render, { once: true });
    }
    return () => {
      cancelled = true;
      if (widgetRef.current && window.turnstile)
        window.turnstile.remove(widgetRef.current);
      widgetRef.current = null;
    };
  }, [siteKey, onToken, resetKey, action]);

  if (!configLoaded) {
    return (
      <div
        className="h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
        aria-label="Loading human verification"
      />
    );
  }

  if (!siteKey) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 px-3 py-2 text-[11px] leading-4 text-amber-900">
        <Bot className="size-4 shrink-0" />
        Bot verification is wired and will enforce automatically after the
        Turnstile keys are configured.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
        <ShieldCheck className="size-3" /> Human verification
      </div>
      <div ref={containerRef} />
    </div>
  );
}
