import { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { asyncHandler } from '../../../src/modules/shared/http';

function createMockContext() {
  const request = {} as Request;
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;

  return { request, response, next };
}

describe('asyncHandler', () => {
  it('ينفذ الـ controller بنجاح دون استدعاء next بأي خطأ', async () => {
    const { request, response, next } = createMockContext();
    const controller = vi.fn(async (_req: Request, res: Response) => {
      res.status(200).json({ ok: true });
    });

    const handler = asyncHandler(controller);
    handler(request, response, next);

    await vi.waitFor(() => {
      expect(controller).toHaveBeenCalledTimes(1);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({ ok: true });
    });

    expect(next).not.toHaveBeenCalled();
  });

  it('يمرر الخطأ إلى next عند رفض الـ Promise', async () => {
    const { request, response, next } = createMockContext();
    const boomError = new Error('Database failure');
    const controller = vi.fn(async () => {
      throw boomError;
    });

    const handler = asyncHandler(controller);
    handler(request, response, next);

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(boomError);
    });
  });

  it('يمرر الخطأ إلى next حتى لو رمى الـ controller خطأ متزامناً', async () => {
    const { request, response, next } = createMockContext();
    const syncError = new Error('Sync failure');
    const controller = vi.fn(() => {
      throw syncError;
    }) as unknown as Parameters<typeof asyncHandler>[0];

    const handler = asyncHandler(controller);
    handler(request, response, next);

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(syncError);
    });
  });

  it('يمرر كائنات request و response و next كما هي إلى الـ controller', async () => {
    const { request, response, next } = createMockContext();
    const controller = vi.fn(async () => undefined);

    const handler = asyncHandler(controller);
    handler(request, response, next);

    await vi.waitFor(() => {
      expect(controller).toHaveBeenCalledWith(request, response, next);
    });
  });
});