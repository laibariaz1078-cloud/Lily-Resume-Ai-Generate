export interface ApiFieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors: ApiFieldError[];
  readonly expose: boolean;

  constructor(statusCode: number, message: string, errors: ApiFieldError[] = [], expose = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.expose = expose;
  }
}
