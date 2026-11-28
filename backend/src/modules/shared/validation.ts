import { AppError } from './errors';

export type BodyRecord = Record<string, unknown>;

export function bodyRecord(value: unknown): BodyRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AppError(400, 'Request body must be a JSON object.');
  }

  return value as BodyRecord;
}

export function onlyKeys(body: BodyRecord, allowed: readonly string[]): void {
  const unexpected = Object.keys(body).find((key) => !allowed.includes(key));
  if (unexpected) {
    throw new AppError(400, `Unexpected field: ${unexpected}.`);
  }
}

export function requiredText(body: BodyRecord, key: string, maxLength: number): string {
  const value = body[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(400, `${key} is required and must be a non-empty string.`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new AppError(400, `${key} must not exceed ${maxLength} characters.`);
  }

  return normalized;
}

export function optionalText(
  body: BodyRecord,
  key: string,
  maxLength: number,
): string | undefined {
  if (body[key] === undefined) {
    return undefined;
  }

  const value = body[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(400, `${key} must be a non-empty string.`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new AppError(400, `${key} must not exceed ${maxLength} characters.`);
  }

  return normalized;
}

export function requiredId(body: BodyRecord, key: string): number {
  const value = body[key];
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new AppError(400, `${key} must be a positive integer.`);
  }

  return value;
}

export function optionalNullableId(
  body: BodyRecord,
  key: string,
): number | null | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new AppError(400, `${key} must be a positive integer or null.`);
  }

  return value;
}

export function requiredLevel(body: BodyRecord, key: string): number {
  const value = requiredId(body, key);
  return value;
}

export function optionalLevel(body: BodyRecord, key: string): number | undefined {
  if (body[key] === undefined) {
    return undefined;
  }

  return requiredLevel(body, key);
}

export function optionalNullableGpa(
  body: BodyRecord,
  key: string,
): number | null | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 4) {
    throw new AppError(400, `${key} must be a number between 0.00 and 4.00, or null.`);
  }

  return value;
}

export function parsePathId(value: unknown, name: string): number {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new AppError(400, `${name} must be a positive integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new AppError(400, `${name} must be a positive integer.`);
  }

  return parsed;
}

export function queryString(value: unknown, name: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(400, `${name} must be a non-empty string.`);
  }

  return value.trim();
}

export function queryPositiveInt(value: unknown, name: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new AppError(400, `${name} must be a positive integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new AppError(400, `${name} must be a positive integer.`);
  }

  return parsed;
}
