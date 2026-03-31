export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentType = 'ACCIDENT' | 'TRAFFIC_JAM' | 'ROAD_BLOCK' | 'WEATHER_HAZARD';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface RoadSegment {
  _id?: string;
  segmentId: string;
  region: string;
  name: string;
  startPoint: GeoPoint;
  endPoint: GeoPoint;
  speedLimit: number;
  lanes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TelemetryEvent {
  _id?: string;
  eventId: string;
  segmentId: string;
  region: string;
  avgSpeedKmh: number;
  flowRate: number;
  occupancy: number;
  weather: 'CLEAR' | 'RAIN' | 'SNOW' | 'FOG';
  timestamp: Date;
}

export interface IncidentEvent {
  _id?: string;
  incidentId: string;
  segmentId: string;
  region: string;
  type: IncidentType;
  severity: Severity;
  description: string;
  affectedLanes: number;
  resolved: boolean;
  timestamp: Date;
}

export interface RiskAggregate {
  _id?: string;
  segmentId: string;
  region: string;
  riskScore: number;
  incidentCountLast24h: number;
  avgSpeedLastHour: number;
  updatedAt: Date;
}

export interface HistoricalAccidentStat {
  _id?: string;
  region: string;
  date: string;
  accidentsCount: number;
  injuriesCount: number;
  fatalitiesCount: number;
  updatedAt: Date;
}

export interface StatsSummary {
  totalIncidents24h: number;
  totalTelemetryEvents24h: number;
  avgRiskScore: number;
  regionsCount: number;
}
