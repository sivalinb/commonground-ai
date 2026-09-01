import { consumeRateLimit } from '@/lib/db';
import { requireSameOrigin, secureJson } from '@/lib/http';
import { fetchKnowledgeGraph } from '@/lib/neo4j';

export async function GET(request: Request) {
  if (!requireSameOrigin(request))
    return secureJson(
      { error: 'Cross-origin requests are not accepted.' },
      403,
    );
  if (
    !(await consumeRateLimit(request, 'knowledge-graph', 60, 10 * 60 * 1000))
  ) {
    return secureJson({ error: 'Graph request limit reached.' }, 429);
  }
  if (
    !process.env.NEO4J_URI ||
    !process.env.NEO4J_USERNAME ||
    !process.env.NEO4J_PASSWORD
  ) {
    return secureJson({ provider: 'metadata', nodes: [] });
  }
  try {
    const nodes = await fetchKnowledgeGraph({
      uri: process.env.NEO4J_URI,
      username: process.env.NEO4J_USERNAME,
      password: process.env.NEO4J_PASSWORD,
      database: process.env.NEO4J_DATABASE || 'neo4j',
    });
    return secureJson({ provider: 'neo4j', nodes });
  } catch {
    return secureJson({ provider: 'metadata', nodes: [] });
  }
}
