export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface DatabaseError {
  code: string;
}

function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}

export function toHttpError(error: unknown): { status: number; message: string } {
  if (error instanceof AppError) {
    return { status: error.status, message: error.message };
  }

  if (isDatabaseError(error)) {
    if (error.code === '23505') {
      return { status: 409, message: 'A record with the same unique value already exists.' };
    }

    if (error.code === '23503') {
      return { status: 400, message: 'A referenced record does not exist.' };
    }

    if (error.code === '22P02') {
      return { status: 400, message: 'An identifier or value has an invalid format.' };
    }
  }

  return { status: 500, message: 'Internal server error.' };
}
