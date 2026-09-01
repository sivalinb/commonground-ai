import { z } from 'zod';

import { fetchWithPolicy } from './http';

export type Neo4jRuntime = {
  uri: string;
  username: string;
  password: string;
  database: string;
};

const responseSchema = z.object({
  data: z.object({
    fields: z.array(z.string()),
    values: z.array(z.array(z.unknown())),
  }),
  errors: z
    .array(
      z.object({ code: z.string().optional(), message: z.string().optional() }),
    )
    .optional(),
});

function queryEndpoint(runtime: Neo4jRuntime) {
  const host = runtime.uri
    .replace(/^neo4j\+s:\/\//, '')
    .replace(/^neo4j:\/\//, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  if (!/^[a-z0-9.-]+(?::\d+)?$/i.test(host))
    throw new Error('Neo4j URI is invalid.');
  return `https://${host}/db/${encodeURIComponent(runtime.database || 'neo4j')}/query/v2`;
}

async function query(
  runtime: Neo4jRuntime,
  statement: string,
  parameters: Record<string, unknown>,
) {
  const response = await fetchWithPolicy(
    queryEndpoint(runtime),
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${runtime.username}:${runtime.password}`)}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ statement, parameters }),
    },
    { label: 'Neo4j Query API', timeoutMs: 7000, retries: 1 },
  );
  if (!response.ok)
    throw new Error(`Neo4j Query API returned ${response.status}`);
  return responseSchema.parse(await response.json());
}

export async function expandEvidenceGraph(
  runtime: Neo4jRuntime,
  seedIds: string[],
  jurisdictions: string[],
) {
  if (!seedIds.length) return [];
  const result = await query(
    runtime,
    `
    UNWIND $seedIds AS seedId
    MATCH (seed:EvidenceSource {id: seedId})-[:SUPPORTS|APPLIES_IN]->(bridge)<-[:SUPPORTS|APPLIES_IN]-(related:EvidenceSource)
    WHERE related.jurisdiction IN $jurisdictions
    RETURN related.id AS id,
           count(DISTINCT bridge) AS linkCount,
           collect(DISTINCT coalesce(bridge.label, bridge.name, bridge.id))[0..4] AS reasons
    ORDER BY linkCount DESC, id ASC
    LIMIT 12
  `,
    { seedIds, jurisdictions },
  );
  return result.data.values.flatMap((row) => {
    const parsed = z
      .tuple([z.string(), z.number(), z.array(z.string())])
      .safeParse(row);
    return parsed.success
      ? [
          {
            id: parsed.data[0],
            linkCount: parsed.data[1],
            reasons: parsed.data[2],
          },
        ]
      : [];
  });
}

export async function fetchKnowledgeGraph(runtime: Neo4jRuntime) {
  const result = await query(
    runtime,
    `
    MATCH (source:EvidenceSource)-[:SUPPORTS]->(topic:Safeguard)
    MATCH (source)-[:APPLIES_IN]->(jurisdiction:Jurisdiction)
    RETURN source.id AS sourceId,
           source.title AS title,
           topic.id AS topic,
           coalesce(topic.label, topic.id) AS topicLabel,
           jurisdiction.name AS jurisdiction
    ORDER BY source.id ASC
  `,
    {},
  );
  return result.data.values.flatMap((row) => {
    const parsed = z
      .tuple([z.string(), z.string(), z.string(), z.string(), z.string()])
      .safeParse(row);
    return parsed.success
      ? [
          {
            sourceId: parsed.data[0],
            title: parsed.data[1],
            topic: parsed.data[2],
            topicLabel: parsed.data[3],
            jurisdiction: parsed.data[4],
          },
        ]
      : [];
  });
}
