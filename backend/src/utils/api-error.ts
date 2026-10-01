export interface ApiFieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly errors: ApiFieldError[];
  readonly expose: boolean;

  constructor(statusCode: number, message: string, errors: ApiFieldError[] = [], expose = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.expose = expose;
  }
}

export class ApiError extends AppError {
  constructor(statusCode: number, message: string, errors: ApiFieldError[] = [], expose = true) {
    super(statusCode, message, errors, expose);
    this.name = 'ApiError';
  }
}
