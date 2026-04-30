import { validateCreateCandidateInput } from '../application/validator';
import { ValidationError } from '../domain/errors/candidateErrors';

describe('validateCreateCandidateInput', () => {
  it('returns validated candidate payload for valid input', () => {
    const result = validateCreateCandidateInput({
      firstName: ' Ada ',
      lastName: ' Lovelace ',
      email: 'ada@example.com',
      educations: [
        {
          institution: 'University A',
          title: 'Computer Science',
          startDate: '2020-01-01',
        },
      ],
      workExperiences: [
        {
          company: 'Company A',
          position: 'Engineer',
          startDate: '2021-01-01',
        },
      ],
      cv: {
        filePath: '/tmp/cv.pdf',
        fileType: 'application/pdf',
      },
    });

    expect(result.firstName).toBe('Ada');
    expect(result.lastName).toBe('Lovelace');
    expect(result.email).toBe('ada@example.com');
    expect(result.educations).toHaveLength(1);
    expect(result.workExperiences).toHaveLength(1);
    expect(result.cv?.filePath).toBe('/tmp/cv.pdf');
  });

  it('throws validation error for missing firstName', () => {
    expect(() =>
      validateCreateCandidateInput({
        lastName: 'Lovelace',
        email: 'ada@example.com',
      })
    ).toThrow(ValidationError);
  });

  it('throws validation error for invalid email format', () => {
    expect(() =>
      validateCreateCandidateInput({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'invalid-email',
      })
    ).toThrow('email must be a valid email address');
  });

  it('throws validation error when firstName exceeds max length', () => {
    expect(() =>
      validateCreateCandidateInput({
        firstName: 'a'.repeat(101),
        lastName: 'Lovelace',
        email: 'ada@example.com',
      })
    ).toThrow('firstName must be at most 100 characters');
  });

  it('throws validation error for malformed nested payload', () => {
    expect(() =>
      validateCreateCandidateInput({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        educations: [
          {
            institution: 'University A',
            startDate: '2020-01-01',
          },
        ],
      })
    ).toThrow(ValidationError);
  });
});
