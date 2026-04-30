export class ValidationError extends Error {
  readonly code: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}

export class DuplicateEmailError extends Error {
  readonly code: string;

  constructor(message = 'Candidate email already exists') {
    super(message);
    Object.setPrototypeOf(this, DuplicateEmailError.prototype);
    this.name = 'DuplicateEmailError';
    this.code = 'DUPLICATE_EMAIL';
  }
}

export class InternalServerError extends Error {
  readonly code: string;

  constructor(message = 'Internal server error') {
    super(message);
    Object.setPrototypeOf(this, InternalServerError.prototype);
    this.name = 'InternalServerError';
    this.code = 'INTERNAL_SERVER_ERROR';
  }
}
