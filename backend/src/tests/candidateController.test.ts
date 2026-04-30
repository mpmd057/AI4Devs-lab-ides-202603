import { NextFunction, Request, Response } from 'express';
import * as candidateService from '../application/services/candidateService';
import { postCandidate } from '../presentation/controllers/candidateController';

describe('postCandidate controller', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 201 when candidate is created', async () => {
    const req = { body: { firstName: 'Ada' } } as Request;
    const json = jest.fn();
    const res = {
      status: jest.fn().mockReturnValue({ json }),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    const createdCandidate = {
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: null,
      address: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    jest.spyOn(candidateService, 'createCandidate').mockResolvedValue(createdCandidate);

    await postCandidate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(createdCandidate);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards errors to next middleware', async () => {
    const req = { body: {} } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;
    const error = new Error('test');

    jest.spyOn(candidateService, 'createCandidate').mockRejectedValue(error);

    await postCandidate(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
