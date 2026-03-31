import { ApiError } from './errors';

const DEFAULT_LIMIT_MIN = 1;

export const parseLimit = (
  value: unknown,
  max: number,
  defaultValue: number,
  fieldName = 'limit'
): number => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < DEFAULT_LIMIT_MIN || parsed > max) {
    throw new ApiError(400, `Invalid query parameter: ${fieldName}`, 'VALIDATION_ERROR');
  }

  return parsed;
};

export const parseDateParam = (value: unknown, fieldName: 'from' | 'to'): Date | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `Invalid query parameter: ${fieldName}`, 'VALIDATION_ERROR');
  }

  return parsed;
};

export const parseOptionalString = (value: unknown): string | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
};
