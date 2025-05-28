/**
 * Error Handler Utilities
 *
 * Provides consistent error handling patterns across the application
 */

import {
  AppError,
  isAppError,
  createError,
  ValidationError,
  DatabaseError,
  ServiceError,
  type ErrorHandlerOptions,
} from '@/shared/types/errors';

/**
 * Async function wrapper that handles errors consistently
 *
 * @example
 * ```typescript
 * const result = await safeAsync(async () => {
 *   return await riskyOperation();
 * }, { defaultMessage: 'Operation failed' });
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    const appError = createError(error, options.defaultMessage);

    if (options.logError !== false) {
      console.error('Async operation failed:', appError.toJSON());
    }

    return { error: appError };
  }
}

/**
 * Synchronous function wrapper that handles errors consistently
 */
export function safeSync<T>(
  fn: () => T,
  options: ErrorHandlerOptions = {}
): { data?: T; error?: AppError } {
  try {
    const data = fn();
    return { data };
  } catch (error) {
    const appError = createError(error, options.defaultMessage);

    if (options.logError !== false) {
      console.error('Sync operation failed:', appError.toJSON());
    }

    return { error: appError };
  }
}

/**
 * Database operation error handler
 * Converts database-specific errors into standardized AppErrors
 */
export function handleDatabaseError(
  error: unknown,
  operation: string,
  context?: Record<string, any>
): AppError {
  if (error instanceof Error) {
    // Check for specific database error patterns
    if (error.message.includes('unique constraint')) {
      return new ValidationError('This record already exists', undefined, {
        ...context,
        dbOperation: operation,
        originalError: error.message,
      });
    }

    if (error.message.includes('foreign key constraint')) {
      return new ValidationError(
        'Referenced record does not exist',
        undefined,
        { ...context, dbOperation: operation, originalError: error.message }
      );
    }

    if (error.message.includes('not null constraint')) {
      return new ValidationError('Required field is missing', undefined, {
        ...context,
        dbOperation: operation,
        originalError: error.message,
      });
    }

    return new DatabaseError(operation, error.message, error, context);
  }

  return new DatabaseError(
    operation,
    'Unknown database error',
    undefined,
    context
  );
}

/**
 * API response error handler
 * Standardizes error responses for API routes
 */
export function formatErrorResponse(error: unknown): {
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    context?: Record<string, any>;
  };
} {
  const appError = isAppError(error) ? error : createError(error);

  return {
    error: {
      code: appError.code,
      message: appError.getUserMessage(),
      statusCode: appError.statusCode,
      timestamp: appError.timestamp.toISOString(),
      context: appError.context,
    },
  };
}

/**
 * Service method wrapper that provides consistent error handling
 *
 * @example
 * ```typescript
 * class UserService {
 *   async getUser(id: string) {
 *     return withErrorHandling('getUser', async () => {
 *       return await this.repository.findById(id);
 *     });
 *   }
 * }
 * ```
 */
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isAppError(error)) {
      // Re-throw AppErrors as-is
      throw error;
    }

    // Convert unknown errors to ServiceError
    throw new ServiceError(
      operation,
      error instanceof Error ? error.message : 'Unknown error',
      error instanceof Error ? error : undefined,
      context
    );
  }
}

/**
 * Validation helper that throws ValidationError for failed conditions
 *
 * @example
 * ```typescript
 * validate(user.email, 'email', 'Email is required');
 * validate(user.age > 0, 'age', 'Age must be positive');
 * ```
 */
export function validate(
  condition: any,
  field?: string,
  message?: string
): asserts condition {
  if (!condition) {
    throw new ValidationError(
      message || `Validation failed${field ? ` for ${field}` : ''}`,
      field
    );
  }
}

/**
 * Assertion helper that throws appropriate errors
 *
 * @example
 * ```typescript
 * const user = await getUser(id);
 * assertExists(user, 'User', id);
 * ```
 */
export function assertExists<T>(
  value: T | null | undefined,
  resourceName: string,
  resourceId?: string
): asserts value is T {
  if (value == null) {
    throw new ValidationError(
      `${resourceName} not found`,
      resourceName.toLowerCase(),
      { resourceId }
    );
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: unknown) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if condition is not met or this is the last attempt
      if (!retryCondition(error) || attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw createError(
    lastError,
    `Operation failed after ${maxAttempts} attempts`
  );
}
