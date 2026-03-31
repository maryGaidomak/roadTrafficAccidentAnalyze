import { randomUUID } from 'crypto';
import { IncidentEvent, IncidentType, Severity, TelemetryEvent } from '../domain/models';

const weatherOptions: TelemetryEvent['weather'][] = ['CLEAR', 'RAIN', 'SNOW', 'FOG'];
const incidentTypes: IncidentType[] = ['ACCIDENT', 'TRAFFIC_JAM', 'ROAD_BLOCK', 'WEATHER_HAZARD'];

const randomItem = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)] as T;

const getVisibilityFactor = (weather: TelemetryEvent['weather']): number => {
  if (weather === 'FOG') return 0.55;
  if (weather === 'SNOW') return 0.65;
  if (weather === 'RAIN') return 0.8;
  return 1;
};

const getRoadSurfaceFactor = (weather: TelemetryEvent['weather']): number => {
  if (weather === 'SNOW') return 0.6;
  if (weather === 'RAIN') return 0.75;
  return 1;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const generateTelemetryEvent = (segmentId: string, region: string): TelemetryEvent => {
  const weather = randomItem(weatherOptions);
  const occupancy = Number((0.2 + Math.random() * 0.8).toFixed(2));
  const flowRate = Math.floor(200 + occupancy * 1800 + Math.random() * 300);
  const visibilityFactor = getVisibilityFactor(weather);
  const roadSurfaceFactor = getRoadSurfaceFactor(weather);
  const baseSpeed = 95 - occupancy * 50;
  const weatherPenalty = (1 - visibilityFactor) * 18 + (1 - roadSurfaceFactor) * 20;
  const avgSpeedKmh = Number(clamp(baseSpeed - weatherPenalty + Math.random() * 8, 8, 120).toFixed(2));
  const timestamp = new Date();

  return {
    eventId: randomUUID(),
    segmentId,
    region,
    avgSpeedKmh,
    flowRate,
    occupancy,
    weather,
    event_time: timestamp,
    timestamp
  };
};

export const calculateRiskScore = (telemetry: TelemetryEvent): number => {
  const speedRisk = clamp((90 - telemetry.avgSpeedKmh) / 90, 0, 1);
  const occupancyRisk = clamp(telemetry.occupancy, 0, 1);
  const visibilityRisk = 1 - getVisibilityFactor(telemetry.weather);
  const surfaceRisk = 1 - getRoadSurfaceFactor(telemetry.weather);

  return Number(clamp(0.4 * occupancyRisk + 0.3 * speedRisk + 0.2 * visibilityRisk + 0.1 * surfaceRisk, 0, 1).toFixed(2));
};

const getSeverityByRisk = (riskScore: number): Severity => {
  if (riskScore >= 0.85) return 'CRITICAL';
  if (riskScore >= 0.65) return 'HIGH';
  if (riskScore >= 0.4) return 'MEDIUM';
  return 'LOW';
};

export const shouldGenerateIncident = (riskScore: number, baseProbability: number): boolean => {
  const adjustedProbability = clamp(baseProbability * 0.4 + riskScore * 0.7, 0.02, 0.95);
  return Math.random() <= adjustedProbability;
};

export const generateIncidentEvent = (segmentId: string, region: string, riskScore: number): IncidentEvent => {
  const timestamp = new Date();

  return {
    incidentId: randomUUID(),
    segmentId,
    region,
    type: riskScore > 0.7 ? 'ACCIDENT' : randomItem(incidentTypes),
    severity: getSeverityByRisk(riskScore),
    description: `Auto-generated incident (riskScore=${riskScore})`,
    affectedLanes: 1 + Math.floor(riskScore * 3),
    resolved: false,
    event_time: timestamp,
    timestamp
  };
};
