const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';

const endpoints = [
  '/health',
  '/api/incidents/recent',
  '/api/telemetry/recent',
  '/api/risk/top',
  '/api/stats/summary',
  '/api/regions',
  '/api/stats/historical'
] as const;

const checkEndpoint = async (path: string): Promise<void> => {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${path} responded with status ${response.status}`);
  }
  console.log(`OK ${path}`);
};

const run = async (): Promise<void> => {
  for (const endpoint of endpoints) {
    await checkEndpoint(endpoint);
  }
  console.log('Smoke check completed successfully');
};

run().catch((error: Error) => {
  console.error('Smoke check failed:', error.message);
  process.exit(1);
});

export {};
