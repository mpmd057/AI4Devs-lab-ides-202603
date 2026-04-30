import {
  InternalServerError,
  ValidationError,
  DuplicateEmailError,
} from '../../domain/errors/candidateErrors';
import { CreateCandidateResponse } from '../../domain/types/candidate';
import { createCandidateRecord } from '../../infrastructure/repositories/candidateRepository';
import { validateCreateCandidateInput } from '../validator';

export async function createCandidate(input: unknown): Promise<CreateCandidateResponse> {
  const validatedInput = validateCreateCandidateInput(input);

  try {
    return await createCandidateRecord(validatedInput);
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof DuplicateEmailError ||
      error instanceof InternalServerError
    ) {
      throw error;
    }

    throw new InternalServerError();
  }
}
