import { randomUUID } from 'crypto';
import { IncidentEvent, IncidentType, Severity, TelemetryEvent } from '../domain/models';

const weatherOptions: TelemetryEvent['weather'][] = ['CLEAR', 'RAIN', 'SNOW', 'FOG'];
const incidentTypes: IncidentType[] = ['ACCIDENT', 'TRAFFIC_JAM', 'ROAD_BLOCK', 'WEATHER_HAZARD'];
const severities: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const randomItem = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)] as T;

export const generateTelemetryEvent = (segmentId: string, region: string): TelemetryEvent => ({
  eventId: randomUUID(),
  segmentId,
  region,
  avgSpeedKmh: Number((Math.random() * 100).toFixed(2)),
  flowRate: Math.floor(100 + Math.random() * 1500),
  occupancy: Number(Math.random().toFixed(2)),
  weather: randomItem(weatherOptions),
  timestamp: new Date()
});

export const generateIncidentEvent = (segmentId: string, region: string): IncidentEvent => ({
  incidentId: randomUUID(),
  segmentId,
  region,
  type: randomItem(incidentTypes),
  severity: randomItem(severities),
  description: 'Auto-generated incident from simulator',
  affectedLanes: 1 + Math.floor(Math.random() * 3),
  resolved: false,
  timestamp: new Date()
});
