import { ValidationError } from '../domain/errors/candidateErrors';
import {
  CandidateCvInput,
  CandidateEducationInput,
  CandidateWorkExperienceInput,
  CreateCandidateInput,
} from '../domain/types/candidate';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number
): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required`);
  }

  const parsed = value.trim();
  if (parsed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`);
  }

  return parsed;
}

function parseOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  const parsed = value.trim();
  if (parsed.length === 0) {
    return undefined;
  }

  if (parsed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`);
  }

  return parsed;
}

function parseDateString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a valid date string`);
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date string`);
  }

  return value;
}

function parseEducations(value: unknown): CandidateEducationInput[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new ValidationError('educations must be an array');
  }

  return value.map((item, index) => {
    if (!isObject(item)) {
      throw new ValidationError(`educations[${index}] must be an object`);
    }

    return {
      institution: parseRequiredString(item.institution, `educations[${index}].institution`, 100),
      title: parseRequiredString(item.title, `educations[${index}].title`, 250),
      startDate: parseDateString(item.startDate, `educations[${index}].startDate`),
      endDate: item.endDate === undefined
        ? undefined
        : parseDateString(item.endDate, `educations[${index}].endDate`),
    };
  });
}

function parseWorkExperiences(value: unknown): CandidateWorkExperienceInput[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new ValidationError('workExperiences must be an array');
  }

  return value.map((item, index) => {
    if (!isObject(item)) {
      throw new ValidationError(`workExperiences[${index}] must be an object`);
    }

    return {
      company: parseRequiredString(item.company, `workExperiences[${index}].company`, 100),
      position: parseRequiredString(item.position, `workExperiences[${index}].position`, 100),
      description: parseOptionalString(
        item.description,
        `workExperiences[${index}].description`,
        200
      ),
      startDate: parseDateString(item.startDate, `workExperiences[${index}].startDate`),
      endDate: item.endDate === undefined
        ? undefined
        : parseDateString(item.endDate, `workExperiences[${index}].endDate`),
    };
  });
}

function parseCv(value: unknown): CandidateCvInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    throw new ValidationError('cv must be an object');
  }

  return {
    filePath: parseRequiredString(value.filePath, 'cv.filePath', 500),
    fileType: parseRequiredString(value.fileType, 'cv.fileType', 50),
  };
}

export function validateCreateCandidateInput(input: unknown): CreateCandidateInput {
  if (!isObject(input)) {
    throw new ValidationError('Request body must be an object');
  }

  const firstName = parseRequiredString(input.firstName, 'firstName', 100);
  const lastName = parseRequiredString(input.lastName, 'lastName', 100);
  const email = parseRequiredString(input.email, 'email', 255);

  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError('email must be a valid email address');
  }

  return {
    firstName,
    lastName,
    email,
    phone: parseOptionalString(input.phone, 'phone', 15),
    address: parseOptionalString(input.address, 'address', 100),
    educations: parseEducations(input.educations),
    workExperiences: parseWorkExperiences(input.workExperiences),
    cv: parseCv(input.cv),
  };
}
