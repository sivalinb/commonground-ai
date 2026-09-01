const ALLOWED_DOMAINS = [
  'ovc.ojp.gov',
  'ojp.gov',
  'stopbullying.gov',
  'cdpsdocs.state.co.us',
  'colorado.gov',
  'courts.state.co.us',
  'missingkids.org',
  'erieco.gov',
];

export async function POST(request: Request) {
  try {
    const { query = '' } = (await request.json()) as { query?: string };
    const clean = query.trim();
    if (clean.length < 10 || clean.length > 500) return Response.json({ error: 'Use a 10–500 character fictional research question.' }, { status: 400 });
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean) || /\b(?:case|report|incident)\s*(?:number|no\.?|#)?\s*[:#-]?\s*[A-Z0-9-]{5,}\b/i.test(clean)) {
      return Response.json({ error: 'Remove identifying or case-specific information before researching.' }, { status: 422 });
    }
    if (!process.env.YOU_API_KEY) return Response.json({ error: 'Freshness research is not configured.' }, { status: 503 });
    const started = Date.now();
    const response = await fetch('https://ydc-index.io/v1/search', {
      method: 'POST',
      headers: { 'X-API-Key': process.env.YOU_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: clean, count: 6, safesearch: 'strict', include_domains: ALLOWED_DOMAINS }),
    });
    if (!response.ok) throw new Error(`You.com returned ${response.status}`);
    const body = (await response.json()) as any;
    const combined = [...(body.results?.web || []), ...(body.results?.news || [])];
    const results = combined.slice(0, 6).map((item: any) => ({
      title: item.title,
      url: item.url,
      description: item.description || item.snippets?.[0] || '',
      publishedAt: item.page_age || null,
    }));
    return Response.json({ results, latencyMs: Date.now() - started, advisoryOnly: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Freshness research could not complete.' }, { status: 502 });
  }
}
