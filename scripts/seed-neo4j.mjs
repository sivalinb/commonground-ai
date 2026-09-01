import { readFile } from 'node:fs/promises';

const required = ['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required.`);
}

const documents = JSON.parse(
  await readFile(new URL('../data/knowledge.json', import.meta.url), 'utf8'),
);
const topicLabels = {
  'victim-autonomy': 'Choice and autonomy',
  safety: 'Safety first',
  preparation: 'Preparation',
  privacy: 'Privacy',
  'law-and-policy': 'Colorado policy',
  'youth-safety': 'Youth safety',
  'victim-services': 'Victim services',
};

const host = process.env.NEO4J_URI.replace(/^neo4j\+s:\/\//, '')
  .replace(/^neo4j:\/\//, '')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const database = process.env.NEO4J_DATABASE || 'neo4j';
const endpoint = `https://${host}/db/${encodeURIComponent(database)}/query/v2`;
const authorization = `Basic ${Buffer.from(`${process.env.NEO4J_USERNAME}:${process.env.NEO4J_PASSWORD}`).toString('base64')}`;

async function query(statement, parameters = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ statement, parameters }),
  });
  if (!response.ok)
    throw new Error(`Neo4j seed request returned ${response.status}`);
  return response.json();
}

await query(
  'CREATE CONSTRAINT evidence_source_id IF NOT EXISTS FOR (source:EvidenceSource) REQUIRE source.id IS UNIQUE',
);
await query(
  'CREATE CONSTRAINT safeguard_id IF NOT EXISTS FOR (safeguard:Safeguard) REQUIRE safeguard.id IS UNIQUE',
);
await query(
  'CREATE CONSTRAINT jurisdiction_name IF NOT EXISTS FOR (jurisdiction:Jurisdiction) REQUIRE jurisdiction.name IS UNIQUE',
);
const result = await query(
  `
  UNWIND $documents AS document
  MERGE (source:EvidenceSource {id: document.id})
  SET source.title = document.title,
      source.section = document.section,
      source.url = document.url,
      source.text = document.text,
      source.topic = document.topic,
      source.jurisdiction = document.jurisdiction,
      source.corpusVersion = 'commonground-rj-v1'
  MERGE (safeguard:Safeguard {id: document.topic})
  SET safeguard.label = document.topicLabel
  MERGE (jurisdiction:Jurisdiction {name: document.jurisdiction})
  MERGE (source)-[:SUPPORTS]->(safeguard)
  MERGE (source)-[:APPLIES_IN]->(jurisdiction)
  RETURN count(source) AS seeded
`,
  {
    documents: documents.map((document) => ({
      ...document,
      topicLabel: topicLabels[document.topic] || document.topic,
    })),
  },
);

const seeded = result?.data?.values?.[0]?.[0] || 0;
console.log(`Seeded ${seeded} approved evidence nodes into Neo4j.`);
