import { NextFunction, Request, Response } from 'express';
import { createCandidate } from '../../application/services/candidateService';

export async function postCandidate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const createdCandidate = await createCandidate(req.body);
    res.status(201).json(createdCandidate);
  } catch (error) {
    next(error);
  }
}
