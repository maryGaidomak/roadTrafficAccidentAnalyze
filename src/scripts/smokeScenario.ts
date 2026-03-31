const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed ${path} (${response.status})`);
  }
  return response.json() as Promise<T>;
};

const run = async (): Promise<void> => {
  const health = await fetchJson<{ status: string }>('/health');
  console.log('OK /health', health.status);

  const telemetryBefore = await fetchJson<Array<{ eventId: string }>>('/api/telemetry/recent?limit=1');
  const incidentsBefore = await fetchJson<Array<{ incidentId: string }>>('/api/incidents/recent?limit=1');

  await sleep(8000);

  const telemetryAfter = await fetchJson<Array<{ eventId: string }>>('/api/telemetry/recent?limit=1');
  const incidentsAfter = await fetchJson<Array<{ incidentId: string }>>('/api/incidents/recent?limit=1');
  const topRisk = await fetchJson<Array<{ segmentId: string; riskScore: number }>>('/api/risk/top?limit=5');

  if (telemetryAfter.length === 0) {
    throw new Error('No telemetry events found. Check simulator + processor');
  }

  if (telemetryBefore[0]?.eventId === telemetryAfter[0]?.eventId) {
    throw new Error('Telemetry stream did not change. Check simulator + processor');
  }

  if (incidentsAfter.length === 0 && incidentsBefore.length === 0) {
    console.warn('WARN incidents are empty (possible if risk/flow low at this moment)');
  } else if (incidentsBefore[0]?.incidentId === incidentsAfter[0]?.incidentId) {
    console.warn('WARN latest incident unchanged in this short window');
  }

  if (topRisk.length === 0) {
    throw new Error('Risk aggregates are empty. Processor aggregation may be down');
  }

  console.log('OK telemetry updates, incidents endpoint reachable, risk aggregates available');
};

run().catch((error: Error) => {
  console.error('Smoke scenario failed:', error.message);
  process.exit(1);
});

export {};
