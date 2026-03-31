import { IncidentEvent, TelemetryEvent } from '../domain/models';

const isValidDate = (value: unknown): boolean => !Number.isNaN(new Date(String(value)).getTime());

export const isTelemetryEventPayload = (payload: unknown): payload is TelemetryEvent => {
  if (!payload || typeof payload !== 'object') return false;
  const event = payload as Partial<TelemetryEvent>;

  return (
    typeof event.eventId === 'string' &&
    typeof event.segmentId === 'string' &&
    typeof event.region === 'string' &&
    typeof event.avgSpeedKmh === 'number' &&
    typeof event.flowRate === 'number' &&
    typeof event.occupancy === 'number' &&
    typeof event.weather === 'string' &&
    isValidDate(event.timestamp)
  );
};

export const isIncidentEventPayload = (payload: unknown): payload is IncidentEvent => {
  if (!payload || typeof payload !== 'object') return false;
  const event = payload as Partial<IncidentEvent>;

  return (
    typeof event.incidentId === 'string' &&
    typeof event.segmentId === 'string' &&
    typeof event.region === 'string' &&
    typeof event.type === 'string' &&
    typeof event.severity === 'string' &&
    typeof event.description === 'string' &&
    typeof event.affectedLanes === 'number' &&
    typeof event.resolved === 'boolean' &&
    isValidDate(event.timestamp)
  );
};
