import { describe, expect, it } from 'vitest';
import { AppError, toHttpError } from '../../../src/modules/shared/errors';

describe('AppError', () => {
  it('sets status, message, name, and inherits from Error', () => {
    const err = new AppError(404, 'User not found.');

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.status).toBe(404);
    expect(err.message).toBe('User not found.');
    expect(err.name).toBe('AppError');
  });
});

describe('toHttpError', () => {
  it('returns status and message for an AppError instance', () => {
    const err = new AppError(403, 'Forbidden resource.');

    expect(toHttpError(err)).toEqual({
      status: 403,
      message: 'Forbidden resource.',
    });
  });

  it('maps PostgreSQL unique violation (23505) to 409', () => {
    const dbError = { code: '23505' };

    expect(toHttpError(dbError)).toEqual({
      status: 409,
      message: 'A record with the same unique value already exists.',
    });
  });

  it('maps PostgreSQL foreign key violation (23503) to 400', () => {
    const dbError = { code: '23503' };

    expect(toHttpError(dbError)).toEqual({
      status: 400,
      message: 'A referenced record does not exist.',
    });
  });

  it('maps PostgreSQL invalid text representation (22P02) to 400', () => {
    const dbError = { code: '22P02' };

    expect(toHttpError(dbError)).toEqual({
      status: 400,
      message: 'An identifier or value has an invalid format.',
    });
  });

  it('returns 500 for unknown database error codes', () => {
    const dbError = { code: '99999' };

    expect(toHttpError(dbError)).toEqual({
      status: 500,
      message: 'Internal server error.',
    });
  });

  it('returns 500 for standard Error or non-object values', () => {
    expect(toHttpError(new Error('Unexpected crash'))).toEqual({
      status: 500,
      message: 'Internal server error.',
    });

    expect(toHttpError(null)).toEqual({
      status: 500,
      message: 'Internal server error.',
    });

    expect(toHttpError(undefined)).toEqual({
      status: 500,
      message: 'Internal server error.',
    });

    expect(toHttpError('some string error')).toEqual({
      status: 500,
      message: 'Internal server error.',
    });

    expect(toHttpError({ code: 12345 })).toEqual({
      status: 500,
      message: 'Internal server error.',
    });
  });
});