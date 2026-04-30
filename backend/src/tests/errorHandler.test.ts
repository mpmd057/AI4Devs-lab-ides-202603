import { NextFunction, Request, Response } from 'express';
import {
  DuplicateEmailError,
  ValidationError,
} from '../domain/errors/candidateErrors';
import { errorHandler } from '../middleware/errorHandler';

describe('errorHandler middleware', () => {
  const req = {} as Request;
  const next = jest.fn() as NextFunction;

  function createResponseMock(): Response {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  }

  it('maps ValidationError to 400', () => {
    const res = createResponseMock();

    errorHandler(new ValidationError('Validation failed'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
    });
  });

  it('maps DuplicateEmailError to 409', () => {
    const res = createResponseMock();

    errorHandler(new DuplicateEmailError(), req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Candidate email already exists',
      error: 'DUPLICATE_EMAIL',
    });
  });

  it('maps unknown errors to sanitized 500', () => {
    const res = createResponseMock();

    errorHandler(new Error('db stack trace'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Internal server error',
      error: 'INTERNAL_SERVER_ERROR',
    });
  });
});
