import { createCandidate } from '../application/services/candidateService';
import {
  DuplicateEmailError,
  InternalServerError,
  ValidationError,
} from '../domain/errors/candidateErrors';
import * as candidateRepository from '../infrastructure/repositories/candidateRepository';
import * as validator from '../application/validator';

describe('createCandidate service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns created candidate when input is valid', async () => {
    const validated = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    };
    const created = {
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: null,
      address: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    jest.spyOn(validator, 'validateCreateCandidateInput').mockReturnValue(validated);
    jest.spyOn(candidateRepository, 'createCandidateRecord').mockResolvedValue(created);

    await expect(createCandidate({})).resolves.toEqual(created);
  });

  it('propagates duplicate email error', async () => {
    jest.spyOn(validator, 'validateCreateCandidateInput').mockReturnValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    });
    jest
      .spyOn(candidateRepository, 'createCandidateRecord')
      .mockRejectedValue(new DuplicateEmailError());

    await expect(createCandidate({})).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it('throws internal server error for unexpected repository failures', async () => {
    jest.spyOn(validator, 'validateCreateCandidateInput').mockReturnValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    });
    jest.spyOn(candidateRepository, 'createCandidateRecord').mockRejectedValue(new Error('boom'));

    await expect(createCandidate({})).rejects.toBeInstanceOf(InternalServerError);
  });

  it('throws validation error from validator', async () => {
    jest
      .spyOn(validator, 'validateCreateCandidateInput')
      .mockImplementation(() => {
        throw new ValidationError('firstName is required');
      });

    await expect(createCandidate({})).rejects.toBeInstanceOf(ValidationError);
  });
});
