/**
 * Custom Error Classes for Application-wide Error Handling
 *
 * Provides structured error handling with consistent error codes,
 * HTTP status codes, and error metadata.
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.message;
  }
}

/**
 * Validation errors (400 Bad Request)
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string = 'Invalid input provided',
    public readonly field?: string,
    context?: Record<string, any>
  ) {
    super(message, { ...context, field });
  }

  getUserMessage(): string {
    if (this.field) {
      return `Invalid ${this.field}: ${this.message}`;
    }
    return this.message;
  }
}

/**
 * Authentication errors (401 Unauthorized)
 */
export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;

  constructor(
    message: string = 'Authentication required',
    context?: Record<string, any>
  ) {
    super(message, context);
  }

  getUserMessage(): string {
    return 'Please log in to access this resource';
  }
}

/**
 * Authorization errors (403 Forbidden)
 */
export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;

  constructor(
    message: string = 'Insufficient permissions',
    public readonly requiredRole?: string,
    context?: Record<string, any>
  ) {
    super(message, { ...context, requiredRole });
  }

  getUserMessage(): string {
    return 'You do not have permission to perform this action';
  }
}

/**
 * Resource not found errors (404 Not Found)
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND_ERROR';
  readonly statusCode = 404;

  constructor(
    resource: string = 'Resource',
    public readonly resourceId?: string,
    context?: Record<string, any>
  ) {
    super(`${resource} not found`, { ...context, resourceId });
  }

  getUserMessage(): string {
    return 'The requested resource could not be found';
  }
}

/**
 * Business logic errors (422 Unprocessable Entity)
 */
export class BusinessLogicError extends AppError {
  readonly code = 'BUSINESS_LOGIC_ERROR';
  readonly statusCode = 422;

  constructor(
    message: string,
    public readonly businessRule?: string,
    context?: Record<string, any>
  ) {
    super(message, { ...context, businessRule });
  }
}

/**
 * Service/External API errors (502 Bad Gateway)
 */
export class ServiceError extends AppError {
  readonly code = 'SERVICE_ERROR';
  readonly statusCode = 502;

  constructor(
    service: string,
    message: string = 'Service temporarily unavailable',
    public readonly originalError?: Error,
    context?: Record<string, any>
  ) {
    super(`${service}: ${message}`, { ...context, service });
  }

  getUserMessage(): string {
    return 'A service is temporarily unavailable. Please try again later';
  }
}

/**
 * Configuration errors (500 Internal Server Error)
 */
export class ConfigurationError extends AppError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 500;

  constructor(
    setting: string,
    message: string = 'Invalid configuration',
    context?: Record<string, any>
  ) {
    super(`Configuration error: ${setting} - ${message}`, {
      ...context,
      setting,
    });
  }

  getUserMessage(): string {
    return 'A configuration error occurred. Please contact support';
  }
}

/**
 * Database operation errors (500 Internal Server Error)
 */
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(
    operation: string,
    message: string = 'Database operation failed',
    public readonly originalError?: Error,
    context?: Record<string, any>
  ) {
    super(`Database ${operation}: ${message}`, { ...context, operation });
  }

  getUserMessage(): string {
    return 'A database error occurred. Please try again later';
  }
}

/**
 * Rate limiting errors (429 Too Many Requests)
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly statusCode = 429;

  constructor(
    message: string = 'Too many requests',
    public readonly retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(message, { ...context, retryAfter });
  }

  getUserMessage(): string {
    const retryMessage = this.retryAfter
      ? ` Please try again in ${this.retryAfter} seconds.`
      : ' Please try again later.';
    return `Too many requests.${retryMessage}`;
  }
}

/**
 * File operation errors (500 Internal Server Error)
 */
export class FileOperationError extends AppError {
  readonly code = 'FILE_OPERATION_ERROR';
  readonly statusCode = 500;

  constructor(
    operation: string,
    filename?: string,
    message: string = 'File operation failed',
    context?: Record<string, any>
  ) {
    const fullMessage = filename
      ? `File ${operation} failed for ${filename}: ${message}`
      : `File ${operation} failed: ${message}`;
    super(fullMessage, { ...context, operation, filename });
  }

  getUserMessage(): string {
    return 'A file operation failed. Please try again';
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Error factory for creating errors from unknown types
 */
export function createError(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred'
): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ServiceError('Unknown', error.message, error);
  }

  if (typeof error === 'string') {
    return new ServiceError('Unknown', error);
  }

  return new ServiceError('Unknown', defaultMessage);
}

/**
 * Error handler utility for consistent error processing
 */
export interface ErrorHandlerOptions {
  logError?: boolean;
  rethrow?: boolean;
  defaultMessage?: string;
  context?: Record<string, any>;
}

export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): AppError {
  const {
    logError = true,
    rethrow = false,
    defaultMessage = 'An unexpected error occurred',
    context = {},
  } = options;

  const appError = createError(error, defaultMessage);

  // Add additional context
  if (Object.keys(context).length > 0) {
    Object.assign(appError.context || {}, context);
  }

  if (logError) {
    console.error('Error occurred:', appError.toJSON());
  }

  if (rethrow) {
    throw appError;
  }

  return appError;
}
