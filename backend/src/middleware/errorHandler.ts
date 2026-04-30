import { NextFunction, Request, Response } from 'express';
import {
  DuplicateEmailError,
  InternalServerError,
  ValidationError,
} from '../domain/errors/candidateErrors';

type ErrorResponseBody = {
  message: string;
  error: string;
};

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response<ErrorResponseBody>,
  next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ message: err.message, error: err.code });
    return;
  }

  if (err instanceof DuplicateEmailError) {
    res.status(409).json({ message: err.message, error: err.code });
    return;
  }

  const internalError =
    err instanceof InternalServerError ? err : new InternalServerError('Internal server error');

  res.status(500).json({
    message: internalError.message,
    error: internalError.code,
  });
}
