import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env variable: ${key}`);
  }
  return value;
};

const getNumberEnv = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Env variable ${key} must be a number`);
  }
  return value;
};

const getBooleanEnv = (key: string, fallback: boolean): boolean => {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }
  return raw.toLowerCase() === 'true';
};

const getSimulatorMode = (): 'kafka' | 'kafka+mongo' | 'console' => {
  const value = (process.env.SIMULATOR_MODE ?? '').toLowerCase();
  if (value === 'kafka' || value === 'kafka+mongo' || value === 'console') {
    return value;
  }

  return getBooleanEnv('SIMULATOR_WRITE_TO_MONGO', true) ? 'kafka+mongo' : 'kafka';
};

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getNumberEnv('PORT', 3000),
  mongoUri: getEnv('MONGO_URI', 'mongodb://localhost:27017'),
  mongoDbName: getEnv('MONGO_DB_NAME', 'road_traffic'),
  kafkaClientId: getEnv('KAFKA_CLIENT_ID', 'road-traffic-backend'),
  kafkaBrokers: getEnv('KAFKA_BROKERS', 'localhost:9092').split(','),
  kafkaTelemetryTopic: getEnv('KAFKA_TELEMETRY_TOPIC', 'road.telemetry'),
  kafkaIncidentsTopic: getEnv('KAFKA_INCIDENTS_TOPIC', 'road.incidents'),
  simulatorMinIntervalMs: getNumberEnv('SIMULATOR_MIN_INTERVAL_MS', 2000),
  simulatorMaxIntervalMs: getNumberEnv('SIMULATOR_MAX_INTERVAL_MS', 5000),
  simulatorIncidentProbability: getNumberEnv('SIMULATOR_INCIDENT_PROBABILITY', 0.2),
  simulatorWriteToMongo: getBooleanEnv('SIMULATOR_WRITE_TO_MONGO', true),
  simulatorMode: getSimulatorMode()
};
