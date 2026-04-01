import { promises as fs } from 'fs';
import path from 'path';

export type RawRecord = Record<string, unknown>;

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseCsv = (content: string): RawRecord[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0] as string);

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const record: RawRecord = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? '';
    });

    return record;
  });
};

export const pickString = (record: RawRecord, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
};

export const pickNumber = (record: RawRecord, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const normalized = value.replace(',', '.');
      const parsed = Number(normalized);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const parseJson = (content: string): RawRecord[] => {
  const parsed = JSON.parse(content) as unknown;
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is RawRecord => typeof item === 'object' && item !== null);
  }

  if (typeof parsed === 'object' && parsed !== null) {
    const payload = (parsed as { data?: unknown }).data;
    if (Array.isArray(payload)) {
      return payload.filter((item): item is RawRecord => typeof item === 'object' && item !== null);
    }
  }

  throw new Error('JSON file must contain an array or { data: [] } payload');
};

export const resolveInputPath = (): string => {
  const arg = process.argv.slice(2).find((item: string) => !item.startsWith('--'));
  const fileOption = process.argv.slice(2).find((item: string) => item.startsWith('--file='));
  const cliPath = fileOption?.split('=')[1] ?? arg;
  const envPath = process.env.IMPORT_FILE_PATH;
  const inputPath = cliPath ?? envPath;

  if (!inputPath) {
    throw new Error('Input file path is required. Use `npm run ... -- ./path/file.json` or IMPORT_FILE_PATH env');
  }

  return path.resolve(process.cwd(), inputPath);
};

export const readInputRecords = async (filePath: string): Promise<RawRecord[]> => {
  const ext = path.extname(filePath).toLowerCase();
  const content = await fs.readFile(filePath, 'utf-8');

  if (ext === '.json') {
    return parseJson(content);
  }

  if (ext === '.csv') {
    return parseCsv(content);
  }

  throw new Error(`Unsupported file extension: ${ext}. Use .json or .csv`);
};

export const normalizeDate = (value: unknown): string | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('.');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};
