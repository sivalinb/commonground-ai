import { BookOpenCheck, Database, GitBranch, Globe2, Network, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import knowledge from '@/data/knowledge.json';

const topicLabels: Record<string, string> = {
  'victim-autonomy': 'Choice & autonomy',
  safety: 'Safety first',
  preparation: 'Preparation',
  privacy: 'Privacy',
  'law-and-policy': 'Colorado policy',
  'youth-safety': 'Youth safety',
  'victim-services': 'Victim services',
};

export function KnowledgeMap() {
  const groups = Object.entries(knowledge.reduce<Record<string, typeof knowledge>>((accumulator, item) => {
    (accumulator[item.topic] ||= []).push(item);
    return accumulator;
  }, {}));
  return (
    <section aria-label="Knowledge relationship map">
      <div className="mb-5 max-w-4xl"><p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-primary"><Network className="size-3.5" /> Corpus relationship layer</p><h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">See how sources connect to safeguards and jurisdictions.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">This deterministic map exposes the relationships already used for metadata filtering and citations. It is the zero-cost precursor to a managed Neo4j GraphRAG layer.</p></div>
      <div className="mb-5 grid gap-3 md:grid-cols-3"><Card className="border-sky-200 bg-sky-50"><CardContent className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white"><Globe2 className="size-5 text-sky-700" /></span><div><p className="font-mono text-2xl font-semibold">2</p><p className="text-xs text-muted-foreground">Jurisdiction scopes</p></div></CardContent></Card><Card className="border-violet-200 bg-violet-50"><CardContent className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white"><GitBranch className="size-5 text-violet-700" /></span><div><p className="font-mono text-2xl font-semibold">{groups.length}</p><p className="text-xs text-muted-foreground">Safeguard topics</p></div></CardContent></Card><Card className="border-emerald-200 bg-emerald-50"><CardContent className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-white"><Database className="size-5 text-emerald-700" /></span><div><p className="font-mono text-2xl font-semibold">{knowledge.length}</p><p className="text-xs text-muted-foreground">Approved evidence nodes</p></div></CardContent></Card></div>
      <div className="relative rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white sm:p-7"><div className="absolute left-1/2 top-20 hidden h-[calc(100%-8rem)] w-px bg-gradient-to-b from-teal-300/60 to-transparent lg:block" aria-hidden="true" /><div className="relative mx-auto mb-7 flex max-w-md items-center justify-center gap-3 rounded-2xl border border-teal-300/30 bg-teal-300/10 p-4"><span className="grid size-11 place-items-center rounded-xl bg-teal-300 text-slate-950"><ShieldCheck className="size-5" /></span><div><p className="text-sm font-semibold">Victim-centered practice safeguards</p><p className="mt-1 text-[10px] text-slate-400">Central concept · human-reviewed</p></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map(([topic, sources]) => <Card key={topic} className="border border-white/10 bg-white/[0.045] text-white"><CardHeader><div className="mb-2 flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-white/10 text-teal-200"><GitBranch className="size-4" /></span><Badge className="border border-white/15 bg-white/5 text-slate-200">{sources?.length || 0} nodes</Badge></div><CardTitle className="text-white">{topicLabels[topic] || topic}</CardTitle><CardDescription className="text-slate-400">connects to approved source evidence</CardDescription></CardHeader><CardContent className="space-y-2">{sources?.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="flex gap-2 rounded-lg border border-white/10 bg-black/10 p-2.5 hover:border-teal-300/40"><BookOpenCheck className="mt-0.5 size-3.5 shrink-0 text-teal-300" /><span><span className="block text-[11px] font-semibold leading-4">{source.title}</span><span className="mt-1 block font-mono text-[9px] text-slate-500">{source.jurisdiction} · {source.id}</span></span></a>)}</CardContent></Card>)}</div></div>
    </section>
  );
}
