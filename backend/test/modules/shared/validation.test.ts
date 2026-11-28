import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/modules/shared/errors';
import {
  bodyRecord,
  onlyKeys,
  optionalLevel,
  optionalNullableGpa,
  optionalNullableId,
  optionalText,
  parsePathId,
  queryPositiveInt,
  queryString,
  requiredId,
  requiredLevel,
  requiredText,
} from '../../../src/modules/shared/validation';

function expectAppError(fn: () => unknown, statusCode: number, message?: string): void {
  try {
    fn();
    expect.unreachable('Expected AppError to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    if (error instanceof AppError) {
      expect(error.status).toBe(statusCode);
      if (message !== undefined) {
        expect(error.message).toBe(message);
      }
    }
  }
}

describe('bodyRecord', () => {
  it('returns the object when given a valid JSON object', () => {
    const input = { name: 'Ahmed', count: 3 };
    expect(bodyRecord(input)).toBe(input);
  });

  it.each([null, undefined, 'string', 123, true, [], () => {}])(
    'throws 400 when given non-object or array: %p',
    (invalid) => {
      expectAppError(() => bodyRecord(invalid), 400, 'Request body must be a JSON object.');
    },
  );
});

describe('onlyKeys', () => {
  it('passes when all keys are allowed', () => {
    expect(() => onlyKeys({ a: 1, b: 2 }, ['a', 'b', 'c'])).not.toThrow();
  });

  it('throws 400 on the first unexpected key', () => {
    expectAppError(
      () => onlyKeys({ a: 1, extra: true }, ['a']),
      400,
      'Unexpected field: extra.',
    );
  });
});

describe('requiredText & optionalText', () => {
  it('returns trimmed text when valid and within maxLength', () => {
    expect(requiredText({ title: '  Hello World  ' }, 'title', 20)).toBe('Hello World');
  });

  it('throws 400 when missing, empty, whitespace-only, or non-string', () => {
    expectAppError(
      () => requiredText({}, 'title', 20),
      400,
      'title is required and must be a non-empty string.',
    );
    expectAppError(
      () => requiredText({ title: '   ' }, 'title', 20),
      400,
      'title is required and must be a non-empty string.',
    );
    expectAppError(
      () => requiredText({ title: 42 }, 'title', 20),
      400,
      'title is required and must be a non-empty string.',
    );
  });

  it('throws 400 when trimmed string exceeds maxLength', () => {
    expectAppError(
      () => requiredText({ title: 'abcdef' }, 'title', 5),
      400,
      'title must not exceed 5 characters.',
    );
  });

  it('optionalText returns undefined when key is undefined', () => {
    expect(optionalText({}, 'note', 50)).toBeUndefined();
  });

  it('optionalText validates when key is present', () => {
    expect(optionalText({ note: '  ok  ' }, 'note', 10)).toBe('ok');
    expectAppError(
      () => optionalText({ note: '' }, 'note', 10),
      400,
      'note must be a non-empty string.',
    );
  });
});

describe('requiredId, optionalNullableId, requiredLevel & optionalLevel', () => {
  it('returns positive safe integer for requiredId', () => {
    expect(requiredId({ userId: 10 }, 'userId')).toBe(10);
  });

  it.each([0, -1, 1.5, '10', null, undefined, Number.MAX_SAFE_INTEGER + 1])(
    'throws 400 for invalid requiredId: %p',
    (badId) => {
      expectAppError(
        () => requiredId({ userId: badId }, 'userId'),
        400,
        'userId must be a positive integer.',
      );
    },
  );

  it('handles undefined, null, and valid numbers in optionalNullableId', () => {
    expect(optionalNullableId({}, 'parentId')).toBeUndefined();
    expect(optionalNullableId({ parentId: null }, 'parentId')).toBeNull();
    expect(optionalNullableId({ parentId: 7 }, 'parentId')).toBe(7);
  });

  it('throws 400 for invalid non-null optionalNullableId', () => {
    expectAppError(
      () => optionalNullableId({ parentId: 0 }, 'parentId'),
      400,
      'parentId must be a positive integer or null.',
    );
    expectAppError(
      () => optionalNullableId({ parentId: '7' }, 'parentId'),
      400,
      'parentId must be a positive integer or null.',
    );
  });

  it('validates requiredLevel and optionalLevel', () => {
    expect(requiredLevel({ level: 3 }, 'level')).toBe(3);
    expect(optionalLevel({}, 'level')).toBeUndefined();
    expect(optionalLevel({ level: 2 }, 'level')).toBe(2);
    expectAppError(
      () => optionalLevel({ level: -5 }, 'level'),
      400,
      'level must be a positive integer.',
    );
  });
});

describe('optionalNullableGpa', () => {
  it('allows undefined, null, and numbers between 0 and 4 inclusive', () => {
    expect(optionalNullableGpa({}, 'gpa')).toBeUndefined();
    expect(optionalNullableGpa({ gpa: null }, 'gpa')).toBeNull();
    expect(optionalNullableGpa({ gpa: 0 }, 'gpa')).toBe(0);
    expect(optionalNullableGpa({ gpa: 3.75 }, 'gpa')).toBe(3.75);
    expect(optionalNullableGpa({ gpa: 4 }, 'gpa')).toBe(4);
  });

  it.each([-0.01, 4.01, Number.NaN, Number.POSITIVE_INFINITY, '3.5'])(
    'throws 400 for invalid GPA: %p',
    (badGpa) => {
      expectAppError(
        () => optionalNullableGpa({ gpa: badGpa }, 'gpa'),
        400,
        'gpa must be a number between 0.00 and 4.00, or null.',
      );
    },
  );
});

describe('parsePathId & queryPositiveInt', () => {
  it('parses valid positive integer strings for parsePathId', () => {
    expect(parsePathId('1', 'id')).toBe(1);
    expect(parsePathId('42', 'id')).toBe(42);
  });

  it.each(['0', '-1', '01', '12abc', '1.5', '', 42, null, undefined, '9007199254740992'])(
    'throws 400 for invalid parsePathId: %p',
    (badVal) => {
      expectAppError(() => parsePathId(badVal, 'id'), 400, 'id must be a positive integer.');
    },
  );

  it('returns undefined when query param is missing in queryPositiveInt', () => {
    expect(queryPositiveInt(undefined, 'page')).toBeUndefined();
  });

  it('parses valid positive integer string in queryPositiveInt', () => {
    expect(queryPositiveInt('5', 'page')).toBe(5);
  });

  it.each(['0', '-3', '05', 'abc', 5])(
    'throws 400 for invalid queryPositiveInt when provided: %p',
    (badQuery) => {
      expectAppError(
        () => queryPositiveInt(badQuery, 'page'),
        400,
        'page must be a positive integer.',
      );
    },
  );
});

describe('queryString', () => {
  it('returns undefined when value is undefined', () => {
    expect(queryString(undefined, 'q')).toBeUndefined();
  });

  it('returns trimmed non-empty string', () => {
    expect(queryString('  search term  ', 'q')).toBe('search term');
  });

  it.each(['', '   ', 123, null])('throws 400 for invalid queryString: %p', (bad) => {
    expectAppError(() => queryString(bad, 'q'), 400, 'q must be a non-empty string.');
  });
});